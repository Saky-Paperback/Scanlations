"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reaperscans = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const RS_DOMAIN = "http://saky-paperback.ml/extension";
class Reaperscans extends paperback_extensions_common_1.Source {
    constructor(cheerio) {
        super(cheerio);
    }
    get version() {
        return "1.2.3";
    }
    get name() {
        return "Reaperscans";
    }
    get icon() {
        return "icon.png";
    }
    get author() {
        return "Saky";
    }
    get description() {
        return "Extension that pulls manga from reaper scans";
    }
    get hentaiSource() {
        return false;
    }
    getMangaDetailsRequest(ids) {
        let requests = [];
        for (let id of ids) {
            let metadata = { "id": id };
            requests.push(createRequestObject({
                url: `${RS_DOMAIN}/mangaDetails.php?mangaID=${id}`,
                metadata: metadata,
                method: "GET",
            }));
        }
        return requests;
    }
    getMangaDetails(data, metadata) {
        let mangas = [];
        let json = JSON.parse(data);
        let title = json["title"];
        let desc = json["desc"];
        let cover = json["cover"];
        let isAdult = json["isAdult"];
        let status = paperback_extensions_common_1.MangaStatus.ONGOING;
        let titles = [];
        titles.push(title);
        mangas.push(createManga({
            id: metadata.id,
            titles: titles,
            image: cover,
            rating: 0,
            status: status,
            author: "Unknown",
            artist: "Unknown",
            tags: [],
            desc: desc,
            hentai: isAdult
        }));
        return mangas;
    }
    getChaptersRequest(mangaId) {
        return createRequestObject({
            url: `${RS_DOMAIN}/chapters.php?mangaID=${mangaId}`,
            method: "GET",
            metadata: { mangaId },
        });
    }
    getChapters(data, metadata) {
        let chapters = [];
        let json = JSON.parse(data);
        let i;
        for (i = 0; i < json.length; i++) {
            chapters.push(createChapter({
                id: json[i]["chapterID"],
                mangaId: metadata.mangaId,
                time: undefined,
                name: json[i]["chapterTitle"],
                langCode: paperback_extensions_common_1.LanguageCode.ENGLISH,
                chapNum: json[i]["chapterNum"],
                volume: json[i]["volume"]
            }));
        }
        return chapters;
    }
    getChapterDetailsRequest(mangaId, chapId) {
        return createRequestObject({
            url: `${RS_DOMAIN}/chapterDetails.php?mangaID=${mangaId}&chapID=${chapId}`,
            method: "GET",
            metadata: { mangaId, chapId },
        });
    }
    getChapterDetails(data, metadata) {
        let pages = [];
        let json = JSON.parse(data);
        let i;
        for (i = 0; i < json.length; i++) {
            pages.push(json[i]);
        }
        let chapterDetails = createChapterDetails({
            id: metadata.chapId,
            mangaId: metadata.mangaId,
            pages: pages,
            longStrip: true,
        });
        return chapterDetails;
    }
    searchRequest(query, page) {
        return createRequestObject({
            url: `${RS_DOMAIN}/search.php?q=${escape(query.title.replace(" ", "+"))}`,
            method: "GET",
        });
    }
    search(data) {
        var _a;
        let mangas = [];
        let json = JSON.parse(data);
        let i;
        for (i = 0; i < json.length; i++) {
            mangas.push(createMangaTile({
                id: json[i]["mangaID"],
                image: json[i]["cover"],
                title: createIconText({ text: (_a = json[i]["title"]) !== null && _a !== void 0 ? _a : "" })
            }));
        }
        return mangas;
    }
}
exports.Reaperscans = Reaperscans;
