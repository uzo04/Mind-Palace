import { StockImage } from "../models/index.js";
import { Op } from "sequelize";

const unsplashImage = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;
const unsplashDownload = (id) => `https://unsplash.com/photos/${id}/download?force=true&w=1200`;

const media = {
  rila: unsplashDownload("hRofd-04Tl4"),
  belogradchik: unsplashDownload("5Y1RQQ-ICzE"),
  sevenRila: unsplashDownload("K7HvIvsPy8w"),
  alexanderNevsky: unsplashDownload("Kxq47tC2Avg"),
  tsarevets: unsplashDownload("-KbxinBqYwo"),
  perperikon: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Archaeological_complex_of_Perperikon_05.jpg/1280px-Archaeological_complex_of_Perperikon_05.jpg",
  devetashka: unsplashDownload("tqHyay8rm3o"),
  buzludzha: unsplashDownload("Hiz3TY3iaHI"),
  plovdiv: unsplashDownload("9C8EKMtKCtA"),
  madara: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Madara_Bulgaria.jpg/1280px-Madara_Bulgaria.jpg",
  babaVida: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Baba_Vida_Fortress.jpg/1280px-Baba_Vida_Fortress.jpg",
  bachkovo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/BACHKOVO_MONASTERY_%2C_BULGARIA.jpg/1280px-BACHKOVO_MONASTERY_%2C_BULGARIA.jpg",
  shipka: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Bulgaria_Bulgaria-0849_-_Shipka_Memorial_%287433104118%29.jpg/1280px-Bulgaria_Bulgaria-0849_-_Shipka_Memorial_%287433104118%29.jpg",
  eiffel: unsplashDownload("PM4VZZn-YyM"),
  sagradaFamilia: unsplashDownload("Aw-CUCbWR6A"),
  charlesBridge: unsplashDownload("rMtnJqf_ZGU"),
  montSaintMichel: unsplashDownload("rmTNrIcsmNs"),
  antelope: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/USA_Antelope-Canyon.jpg/1280px-USA_Antelope-Canyon.jpg",
  victoriaFalls: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Victoria_Falls_%2814535387862%29.jpg/1280px-Victoria_Falls_%2814535387862%29.jpg",
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
  { title: "Колизеум", category: "Европа", url: unsplashImage("photo-1552832230-c0197dd311b5") },
  { title: "Венеция", category: "Европа", url: unsplashImage("photo-1514890547357-a9ee288728e0") },
  { title: "Санторини", category: "Европа", url: unsplashImage("photo-1570077188670-e3a8d69ac5ff") },
  { title: "Мостът Тауър", category: "Европа", url: unsplashImage("photo-1513635269975-59663e0ac1ad") },
  { title: "Замък Нойшванщайн", category: "Европа", url: unsplashImage("photo-1467269204594-9661b134dd2b") },
  { title: "Кападокия", category: "Европа", url: unsplashImage("photo-1527838832700-5059252407fa") },
  { title: "Саграда Фамилия", category: "Европа", url: media.sagradaFamilia },
  { title: "Карлов мост", category: "Европа", url: media.charlesBridge },
  { title: "Мон Сен-Мишел", category: "Европа", url: media.montSaintMichel },
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
  { title: "Лейк Луиз", category: "Америка", url: unsplashImage("photo-1501785888041-af3ef285b470") },
  { title: "Антилоп Каньон", category: "Америка", url: media.antelope },
  { title: "Йосемити", category: "Америка", url: unsplashImage("photo-1447752875215-b2761acb3c5d") },
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
}

export default new StockImageService();
