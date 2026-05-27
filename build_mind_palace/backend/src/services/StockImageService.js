import { Op } from "sequelize";
import { StockImage } from "../models/index.js";

const stockPath = (filename) => `/stock-landmarks/${filename}`;

const defaults = [
  { title: "Рилски манастир", category: "България", url: stockPath("rila-monastery.jpg") },
  { title: "Белоградчишки скали", category: "България", url: stockPath("belogradchik-fortress.jpg") },
  { title: "Седемте рилски езера", category: "България", url: stockPath("seven-rila-lakes.jpg") },
  { title: "Храм Александър Невски", category: "България", url: stockPath("alexander-nevsky.jpg") },
  { title: "Царевец", category: "България", url: stockPath("tsarevets.jpg") },
  { title: "Перперикон", category: "България", url: stockPath("perperikon.jpg") },
  { title: "Деветашка пещера", category: "България", url: stockPath("devetashka-cave.jpg") },
  { title: "Бузлуджа", category: "България", url: stockPath("buzludzha.jpg") },
  { title: "Старият Пловдив", category: "България", url: stockPath("old-plovdiv.jpg") },
  { title: "Мадарски конник", category: "България", url: stockPath("madara-rider.jpg") },
  { title: "Баба Вида", category: "България", url: stockPath("baba-vida.jpg") },
  { title: "Бачковски манастир", category: "България", url: stockPath("bachkovo-monastery.jpg") },
  { title: "Шипка", category: "България", url: stockPath("shipka-monument.jpg") },
  { title: "Айфелова кула", category: "Европа", url: stockPath("eiffel-tower.jpg") },
  { title: "Колизеум", category: "Европа", url: stockPath("colosseum.jpg") },
  { title: "Венеция", category: "Европа", url: stockPath("venice.jpg") },
  { title: "Санторини", category: "Европа", url: stockPath("santorini.jpg") },
  { title: "Мостът Тауър", category: "Европа", url: stockPath("tower-bridge.jpg") },
  { title: "Замък Нойшванщайн", category: "Европа", url: stockPath("neuschwanstein.jpg") },
  { title: "Кападокия", category: "Европа", url: stockPath("cappadocia.jpg") },
  { title: "Саграда Фамилия", category: "Европа", url: stockPath("sagrada-familia.jpg") },
  { title: "Карлов мост", category: "Европа", url: stockPath("charles-bridge.jpg") },
  { title: "Мон Сен-Мишел", category: "Европа", url: stockPath("mont-saint-michel.jpg") },
  { title: "Акрополът на Атина", category: "Европа", url: stockPath("acropolis-athens.jpg") },
  { title: "Биг Бен", category: "Европа", url: stockPath("big-ben.jpg") },
  { title: "Стоунхендж", category: "Европа", url: stockPath("stonehenge.jpg") },
  { title: "Езерото Блед", category: "Европа", url: stockPath("lake-bled.jpg") },
  { title: "Тадж Махал", category: "Азия", url: stockPath("taj-mahal.jpg") },
  { title: "Великата китайска стена", category: "Азия", url: stockPath("great-wall.jpg") },
  { title: "Петра", category: "Азия", url: stockPath("petra.jpg") },
  { title: "Бамбукова гора Арашияма", category: "Азия", url: stockPath("arashiyama.jpg") },
  { title: "Кръстовището Шибуя", category: "Азия", url: stockPath("shibuya-crossing.jpg") },
  { title: "Ангкор Ват", category: "Азия", url: stockPath("angkor-wat.jpg") },
  { title: "Планината Фуджи", category: "Азия", url: stockPath("mount-fuji.jpg") },
  { title: "Мачу Пикчу", category: "Америка", url: stockPath("machu-picchu.jpg") },
  { title: "Гранд Каньон", category: "Америка", url: stockPath("grand-canyon.jpg") },
  { title: "Голдън Гейт", category: "Америка", url: stockPath("golden-gate.jpg") },
  { title: "Таймс Скуеър", category: "Америка", url: stockPath("times-square.jpg") },
  { title: "Лейк Луиз", category: "Америка", url: stockPath("lake-louise.jpg") },
  { title: "Антилоп Каньон", category: "Америка", url: stockPath("antelope-canyon.jpg") },
  { title: "Йосемити", category: "Америка", url: stockPath("yosemite.jpg") },
  { title: "Ниагарският водопад", category: "Америка", url: stockPath("niagara-falls.jpg") },
  { title: "Пирамидите в Гиза", category: "Африка", url: stockPath("giza-pyramids.jpg") },
  { title: "Сахара", category: "Африка", url: stockPath("sahara.jpg") },
  { title: "Виктория Фолс", category: "Африка", url: stockPath("victoria-falls.jpg") },
  { title: "Операта в Сидни", category: "Океания", url: stockPath("sydney-opera-house.jpg") },
  { title: "Улуру", category: "Океания", url: stockPath("uluru.jpg") },
  { title: "Милфорд Саунд", category: "Океания", url: stockPath("milford-sound.jpg") },
  { title: "Исландска лагуна", category: "Природни места", url: stockPath("jokulsarlon.jpg") },
  { title: "Северно сияние", category: "Природни места", url: stockPath("aurora.jpg") },
];

const defaultTitles = defaults.map((item) => item.title);
const defaultUrls = defaults.map((item) => item.url);

class StockImageService {
  async syncDefaults() {
    await StockImage.destroy({
      where: {
        [Op.or]: [
          { title: defaultTitles, url: { [Op.notIn]: defaultUrls } },
          { title: { [Op.notIn]: defaultTitles } },
        ],
      },
    });

    const existingDefaults = await StockImage.findAll({
      where: { title: defaultTitles },
    });
    const existingByTitle = new Map(existingDefaults.map((item) => [item.title, item]));

    await Promise.all(defaults.map(async (defaultImage) => {
      const existing = existingByTitle.get(defaultImage.title);

      if (!existing) {
        await StockImage.create(defaultImage);
        return;
      }

      if (existing.url !== defaultImage.url || existing.category !== defaultImage.category) {
        await existing.update({
          url: defaultImage.url,
          category: defaultImage.category,
        });
      }
    }));
  }

  async getAll() {
    await this.syncDefaults();
    return StockImage.findAll({ order: [["category", "ASC"], ["title", "ASC"], ["createdAt", "DESC"]] });
  }

  async getById(id) {
    await this.syncDefaults();
    return StockImage.findByPk(id);
  }
}

export default new StockImageService();
