import { StockImage } from "../models/index.js";
import { Op } from "sequelize";

const unsplashImage = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const media = {
  rila: "https://upload.wikimedia.org/wikipedia/commons/4/46/Rila_Monastery%2C_August_2013.jpg",
  belogradchik: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Belogradchik_Fortress_Entrance.jpg/3840px-Belogradchik_Fortress_Entrance.jpg",
  sevenRila: "https://upload.wikimedia.org/wikipedia/commons/7/75/Vr-ezeren-pan-sm.jpg",
  alexanderNevsky: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Catedral_de_Alejandro_Nevski_--_2019_--_Sof%C3%ADa%2C_Bulgaria.jpg/3840px-Catedral_de_Alejandro_Nevski_--_2019_--_Sof%C3%ADa%2C_Bulgaria.jpg",
  tsarevets: "https://upload.wikimedia.org/wikipedia/commons/0/03/20140621_Veliko_Tarnovo_002.jpg",
  perperikon: "https://upload.wikimedia.org/wikipedia/commons/2/25/Perperikon_Nenko_Lazarow_023.JPG",
  devetashka: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Devetaki_cave.jpg",
  buzludzha: "https://upload.wikimedia.org/wikipedia/commons/6/6a/Sunset_and_Buzludza.jpg",
  plovdiv: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Old_town_of_Plovdiv_01.jpg/1280px-Old_town_of_Plovdiv_01.jpg",
  madara: "https://upload.wikimedia.org/wikipedia/commons/1/18/JE%C5%B9DZIEC_Z_MADARY.JPG",
  babaVida: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Baba_Vida_Klearchos_1.jpg/3840px-Baba_Vida_Klearchos_1.jpg",
  bachkovo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Church_of_the_Dormition%2C_Bachkovo_Monastery_01.jpg/3840px-Church_of_the_Dormition%2C_Bachkovo_Monastery_01.jpg",
  shipka: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/%D0%9F%D0%B0%D0%BC%D0%B5%D1%82%D0%BD%D0%B8%D0%BA%D1%8A%D1%82_%D0%BD%D0%B0_%D1%81%D0%B2%D0%BE%D0%B1%D0%BE%D0%B4%D0%B0%D1%82%D0%B0_%D0%BD%D0%B0_%D0%B2%D1%80%D1%8A%D1%85_%D0%A8%D0%B8%D0%BF%D0%BA%D0%B0_12.jpg/3840px-%D0%9F%D0%B0%D0%BC%D0%B5%D1%82%D0%BD%D0%B8%D0%BA%D1%8A%D1%82_%D0%BD%D0%B0_%D1%81%D0%B2%D0%BE%D0%B1%D0%BE%D0%B4%D0%B0%D1%82%D0%B0_%D0%BD%D0%B0_%D0%B2%D1%80%D1%8A%D1%85_%D0%A8%D0%B8%D0%BF%D0%BA%D0%B0_12.jpg",
  eiffel: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/2560px-Tour_Eiffel_Wikimedia_Commons.jpg",
  sagradaFamilia: "https://upload.wikimedia.org/wikipedia/commons/7/78/SF_maig_2026.jpg",
  charlesBridge: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Prague_07-2016_view_from_Lesser_Town_Tower_of_Charles_Bridge_img3.jpg/3840px-Prague_07-2016_view_from_Lesser_Town_Tower_of_Charles_Bridge_img3.jpg",
  montSaintMichel: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Mont-Saint-Michel_vu_du_ciel.jpg/3840px-Mont-Saint-Michel_vu_du_ciel.jpg",
  antelope: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/USA_Antelope-Canyon.jpg/1280px-USA_Antelope-Canyon.jpg",
  victoriaFalls: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Cataratas_Victoria%2C_Zambia-Zimbabue%2C_2018-07-27%2C_DD_04.jpg/3840px-Cataratas_Victoria%2C_Zambia-Zimbabue%2C_2018-07-27%2C_DD_04.jpg",
  lakeLouise: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Lake_Louise_in_Banff_National_Park%2C_boat_view_2.jpg/3840px-Lake_Louise_in_Banff_National_Park%2C_boat_view_2.jpg",
  acropolis: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/1029_Acropolis_of_Athens_in_Greece_at_night_Photo_by_Giles_Laurent.jpg/3840px-1029_Acropolis_of_Athens_in_Greece_at_night_Photo_by_Giles_Laurent.jpg",
  stonehenge: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Stonehenge2007_07_30.jpg",
  lakeBled: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Lake_Bled_from_the_Mountain.jpg/3840px-Lake_Bled_from_the_Mountain.jpg",
  niagaraFalls: "https://upload.wikimedia.org/wikipedia/commons/a/ab/3Falls_Niagara.jpg",
  bigBen: "https://upload.wikimedia.org/wikipedia/commons/4/43/Elizabeth_Tower%2C_June_2022.jpg",
  mountFuji: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/View_of_Mount_Fuji_from_%C5%8Cwakudani_20211202.jpg/3840px-View_of_Mount_Fuji_from_%C5%8Cwakudani_20211202.jpg",
};

const legacyDefaultUrls = [
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1581093458791-9d15482442f6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1496564203457-11bb12075d90?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1561891415-1a6edb5d5c8c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?auto=format&fit=crop&w=1200&q=80",
];

const defaults = [
  { title: "Рилски манастир", category: "България", url: media.rila },
  { title: "Белоградчишки скали", category: "България", url: media.belogradchik },
  { title: "Седемте рилски езера", category: "България", url: media.sevenRila },
  { title: "Храм Александър Невски", category: "България", url: media.alexanderNevsky },
  { title: "Царевец", category: "България", url: media.tsarevets },
  { title: "Перперикон", category: "България", url: media.perperikon },
  { title: "Деветашка пещера", category: "България", url: media.devetashka },
  { title: "Бузлуджа", category: "България", url: media.buzludzha },
  { title: "Старият Пловдив", category: "България", url: media.plovdiv },
  { title: "Мадарски конник", category: "България", url: media.madara },
  { title: "Баба Вида", category: "България", url: media.babaVida },
  { title: "Бачковски манастир", category: "България", url: media.bachkovo },
  { title: "Шипка", category: "България", url: media.shipka },
  { title: "Айфелова кула", category: "Европа", url: media.eiffel },
  { title: "Колизеум", category: "Европа", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/3840px-Colosseo_2020.jpg" },
  { title: "Венеция", category: "Европа", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Venezia_aerial_view.jpg/3840px-Venezia_aerial_view.jpg" },
  { title: "Санторини", category: "Европа", url: "https://upload.wikimedia.org/wikipedia/commons/b/bf/2011_Dimos_Thiras.png" },
  { title: "Мостът Тауър", category: "Европа", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Tower_Bridge_at_Dawn.jpg/3840px-Tower_Bridge_at_Dawn.jpg" },
  { title: "Замък Нойшванщайн", category: "Европа", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Schloss_Neuschwanstein_2013.jpg/3840px-Schloss_Neuschwanstein_2013.jpg" },
  { title: "Кападокия", category: "Европа", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Cappadocia_balloon_trip%2C_Ortahisar_Castle_%2811893715185%29.jpg/3840px-Cappadocia_balloon_trip%2C_Ortahisar_Castle_%2811893715185%29.jpg" },
  { title: "Саграда Фамилия", category: "Европа", url: media.sagradaFamilia },
  { title: "Карлов мост", category: "Европа", url: media.charlesBridge },
  { title: "Мон Сен-Мишел", category: "Европа", url: media.montSaintMichel },
  { title: "Акрополът на Атина", category: "Европа", url: media.acropolis },
  { title: "Биг Бен", category: "Европа", url: media.bigBen },
  { title: "Стоунхендж", category: "Европа", url: media.stonehenge },
  { title: "Езерото Блед", category: "Европа", url: media.lakeBled },
  { title: "Тадж Махал", category: "Азия", url: unsplashImage("photo-1564507592333-c60657eea523") },
  { title: "Великата китайска стена", category: "Азия", url: unsplashImage("photo-1508804185872-d7badad00f7d") },
  { title: "Петра", category: "Азия", url: unsplashImage("photo-1579606032821-4e6161c81bd3") },
  { title: "Бамбукова гора Арашияма", category: "Азия", url: unsplashImage("photo-1528360983277-13d401cdc186") },
  { title: "Кръстовището Шибуя", category: "Азия", url: unsplashImage("photo-1542051841857-5f90071e7989") },
  { title: "Ангкор Ват", category: "Азия", url: unsplashImage("photo-1508009603885-50cf7c579365") },
  { title: "Мачу Пикчу", category: "Америка", url: unsplashImage("photo-1526392060635-9d6019884377") },
  { title: "Гранд Каньон", category: "Америка", url: unsplashImage("photo-1474044159687-1ee9f3a51722") },
  { title: "Голдън Гейт", category: "Америка", url: unsplashImage("photo-1501594907352-04cda38ebc29") },
  { title: "Таймс Скуеър", category: "Америка", url: unsplashImage("photo-1534430480872-3498386e7856") },
  { title: "Лейк Луиз", category: "Америка", url: media.lakeLouise },
  { title: "Антилоп Каньон", category: "Америка", url: media.antelope },
  { title: "Йосемити", category: "Америка", url: unsplashImage("photo-1447752875215-b2761acb3c5d") },
  { title: "Ниагарският водопад", category: "Америка", url: media.niagaraFalls },
  { title: "Планината Фуджи", category: "Азия", url: media.mountFuji },
  { title: "Пирамидите в Гиза", category: "Африка", url: unsplashImage("photo-1503177119275-0aa32b3a9368") },
  { title: "Сахара", category: "Африка", url: unsplashImage("photo-1509316785289-025f5b846b35") },
  { title: "Виктория Фолс", category: "Африка", url: media.victoriaFalls },
  { title: "Операта в Сидни", category: "Океания", url: unsplashImage("photo-1506973035872-a4ec16b8e8d9") },
  { title: "Улуру", category: "Океания", url: unsplashImage("photo-1528072164453-f4e8ef0d475a") },
  { title: "Милфорд Саунд", category: "Океания", url: unsplashImage("photo-1500534314209-a25ddb2bd429") },
  { title: "Исландска лагуна", category: "Природни места", url: unsplashImage("photo-1500530855697-b586d89ba3ee") },
  { title: "Северно сияние", category: "Природни места", url: unsplashImage("photo-1483347756197-71ef80e95f73") },
];

class StockImageService {
  async syncDefaults() {
    const defaultUrls = new Set(defaults.map((item) => item.url));
    const defaultTitles = defaults.map((item) => item.title);
    const removableLegacyUrls = legacyDefaultUrls.filter((url) => !defaultUrls.has(url));

    await StockImage.destroy({ where: { url: removableLegacyUrls } });
    await StockImage.destroy({
      where: {
        title: defaultTitles,
        url: { [Op.notIn]: defaults.map((item) => item.url) },
      },
    });

    const existingDefaults = await StockImage.findAll({
      where: { url: defaults.map((item) => item.url) },
    });
    const existingByUrl = new Map(existingDefaults.map((item) => [item.url, item]));
    const missing = defaults.filter((item) => !existingByUrl.has(item.url));

    if (missing.length > 0) {
      await StockImage.bulkCreate(missing);
    }

    await Promise.all(defaults.map(async (defaultImage) => {
      const existing = existingByUrl.get(defaultImage.url);
      if (
        existing
        && (existing.title !== defaultImage.title || existing.category !== defaultImage.category)
      ) {
        await existing.update({
          title: defaultImage.title,
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
