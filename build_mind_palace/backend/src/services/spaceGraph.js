import { Op, fn, col } from "sequelize";

import { Content, Location, Space } from "../models/index.js";

function createEmptyContentMap(locationIds) {
  return new Map(locationIds.map((id) => [id, []]));
}

export async function getOwnedSpaceSummaries(userId, { transaction } = {}) {
  const spaces = await Space.findAll({
    where: { userId },
    attributes: ["id", "title", "description", "coverImage", "createdAt", "updatedAt"],
    order: [["createdAt", "DESC"]],
    raw: true,
    transaction,
  });

  if (!spaces.length) {
    return [];
  }

  const counts = await Location.findAll({
    where: { spaceId: { [Op.in]: spaces.map((space) => space.id) } },
    attributes: [
      "spaceId",
      [fn("COUNT", col("id")), "locationCount"],
    ],
    group: ["spaceId"],
    raw: true,
    transaction,
  });

  const countBySpaceId = new Map(
    counts.map((row) => [row.spaceId, Number(row.locationCount || 0)])
  );

  return spaces.map((space) => ({
    ...space,
    locationCount: countBySpaceId.get(space.id) || 0,
  }));
}

export async function getOwnedSpaceGraph(spaceId, userId, { transaction } = {}) {
  const space = await Space.findOne({
    where: { id: spaceId, userId },
    attributes: ["id", "title", "description", "coverImage", "userId", "createdAt", "updatedAt"],
    raw: true,
    transaction,
  });

  if (!space) {
    return null;
  }

  const locations = await Location.findAll({
    where: { spaceId },
    attributes: ["id", "title", "order", "image", "spaceId", "createdAt", "updatedAt"],
    order: [["order", "ASC"], ["createdAt", "ASC"]],
    raw: true,
    transaction,
  });

  if (!locations.length) {
    return {
      ...space,
      Locations: [],
    };
  }

  const locationIds = locations.map((location) => location.id);
  const contentByLocationId = createEmptyContentMap(locationIds);
  const contents = await Content.findAll({
    where: { locationId: { [Op.in]: locationIds } },
    attributes: ["id", "type", "value", "locationId", "createdAt", "updatedAt"],
    order: [["createdAt", "ASC"]],
    raw: true,
    transaction,
  });

  for (const content of contents) {
    const current = contentByLocationId.get(content.locationId);
    if (current) {
      current.push(content);
    }
  }

  return {
    ...space,
    Locations: locations.map((location) => ({
      ...location,
      Contents: contentByLocationId.get(location.id) || [],
    })),
  };
}
