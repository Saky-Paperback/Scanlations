"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reaperscans = void 0;
const Source_1 = require("../Source");
const Manga_1 = require("../../models/Manga/Manga");
const Languages_1 = require("../../models/Languages/Languages");
const RS_DOMAIN = "https://reaperscans.com";
class Reaperscans extends Source_1.Source {
    constructor(cheerio) {
        super(cheerio);
    }
    get version() { return "1.0"; }
    get name() { return "Reaperscans"; }
    get icon() { return "icon.png"; }
    get author() { return "Saky"; }
    get description() { return "Extension that pulls manga from reaper scans"; }
    get hentaiSource() { return false; }
    getMangaDetailsRequest(ids) {
        let requests = [];
        for (let id of ids) {
            requests.push(createRequestObject({
                url: `${RS_DOMAIN}/comics/${id}`,
                method: "GET",
                metadata: { id }
            }));
        }
        return requests;
    }
    getMangaDetails(data, metadata) {
        var _a;
        let mangas = [];
        let $ = this.cheerio.load(data);
        let cover = RS_DOMAIN + ((_a = $("a.media-content").attr("style")) === null || _a === void 0 ? void 0 : _a.match(/\(([^)]+)\)/)[1].toString());
        let title = $("h5.text-highlight").first().text().trim();
        let isAdultItem = $("div.item-feed").filter((i, el) => {
            return $(el).text().trim() === "Mature (18+)";
        }).parents()[1];
        let isAdultText = $("div.no-wrap", isAdult).children().first().text().trim();
        let isAdult = isAdultText === "Yes" ? true : false;
        let description = $("div.col-lg-9").clone().children().remove().end().text().trim();
        let status = Manga_1.MangaStatus.ONGOING;
        let titles = [];
        titles.push(title);
        mangas.push(createManga({
            id: metadata.id,
            titles: titles,
            image: cover,
            rating: Number("0"),
            status: status,
            author: "Unknown",
            artist: "Unknown",
            tags: [],
            desc: description,
            hentai: isAdult,
        }));
        return mangas;
    }
    getChaptersRequest(mangaID) {
        return createRequestObject({
            url: `${RS_DOMAIN}/comics/${mangaID}`,
            method: "GET",
            metadata: { mangaID },
        });
    }
    getChapters(data, metadata) {
        var _a;
        let $ = this.cheerio.load(data);
        let chapters = [];
        let rawChapters = $("div.list-item.col-sm-3").toArray();
        for (let element of rawChapters) {
            let title = $("div.flex", element).children().first().text().trim();
            let chapterNumbers = (_a = $("div.flex a.item-author", element).attr("href")) === null || _a === void 0 ? void 0 : _a.replace(`${RS_DOMAIN}/comics/${metadata.mangaID}/`, "").split("/");
            let chapterID = chapterNumbers[1];
            let chapterNumber = parseInt(chapterNumbers[1]);
            let volume = parseInt(chapterNumbers[0]);
            chapters.push(createChapter({
                id: chapterID,
                mangaID: metadata.mangaID,
                time: undefined,
                name: title,
                langCode: Languages_1.LanguageCode.ENGLISH,
                chapNum: chapterNumber,
                volume: volume,
            }));
        }
        return chapters;
    }
    getChapterDetailsRequest(mangaID, chapID) {
        return createRequestObject({
            url: `${RS_DOMAIN}/comics/${mangaID}/1/${chapID}`,
            method: "GET",
            metadata: { mangaID, chapID },
        });
    }
    getChapterDetails(data, metadata) {
        let $ = this.cheerio.load(data);
        let script = $("script").get();
        let pages = [];
        let toBeEvaledRaw = ``;
        for (let i of script) {
            if (i["children"][0] !== undefined) {
                if (i["children"][0]["data"].includes("window.chapterPages")) {
                    toBeEvaledRaw = i["children"][0]["data"].split(`window.slug = "${metadata.mangaID}";`)[1];
                }
            }
        }
        let toBeEvaled = toBeEvaledRaw.split("window.nextChapter")[0].replace("window.chapterPages", "let chapPages");
        toBeEvaled += "new Array(chapPages)";
        let evaled = eval(toBeEvaled)[0];
        for (let part of evaled) {
            pages.push("https://reaperscans.com" + part);
        }
        let chapterDetails = createChapterDetails({
            id: metadata.chapID,
            mangaId: metadata.mangaID,
            pages: pages,
            longStrip: false,
        });
        return chapterDetails;
    }
    searchRequest(query, page) {
        var _a;
        return createRequestObject({
            url: `${RS_DOMAIN}/comics?query=${escape((_a = query.title) === null || _a === void 0 ? void 0 : _a.replace(" ", "+"))}`,
            method: "GET",
        });
    }
    search(data) {
        let $ = this.cheerio.load(data);
        let mangas = [];
        $("div.list-item").each((index, manga) => {
            var _a, _b;
            let chapterIdRaw = (_a = $("div.list-content div.list-body a", manga).attr("href")) === null || _a === void 0 ? void 0 : _a.split("/");
            let chapterIdClean = chapterIdRaw === null || chapterIdRaw === void 0 ? void 0 : chapterIdRaw.filter((i) => {
                return i != "" && i != null;
            });
            let chapterId = "";
            if (chapterIdClean && chapterIdClean.length > 1) {
                chapterId = chapterIdClean.pop().toString();
            }
            let title = $("div.list-content div.list-body a", manga).text().trim();
            let tag = (_b = $("div.media a", manga).attr("style")) === null || _b === void 0 ? void 0 : _b.match(/\((.*?)\)/);
            let image = RS_DOMAIN + tag[1];
            mangas.push(createMangaTile({
                id: chapterId,
                image: image,
                title: createIconText({ text: title !== null && title !== void 0 ? title : "" }),
            }));
        });
        return mangas;
    }
}
exports.Reaperscans = Reaperscans;
