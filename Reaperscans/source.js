"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.Reaperscans = void 0;
var paperback_extensions_common_1 = require("paperback-extensions-common");
var RS_DOMAIN = "https://reaperscans.com";
var Reaperscans = /** @class */ (function (_super) {
    __extends(Reaperscans, _super);
    function Reaperscans(cheerio) {
        return _super.call(this, cheerio) || this;
    }
    Object.defineProperty(Reaperscans.prototype, "version", {
        get: function () {
            return "1.1";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Reaperscans.prototype, "name", {
        get: function () {
            return "Reaperscans";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Reaperscans.prototype, "icon", {
        get: function () {
            return "icon.png";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Reaperscans.prototype, "author", {
        get: function () {
            return "Saky";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Reaperscans.prototype, "description", {
        get: function () {
            return "Extension that pulls manga from reaper scans";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Reaperscans.prototype, "hentaiSource", {
        get: function () {
            return false;
        },
        enumerable: false,
        configurable: true
    });
    Reaperscans.prototype.getMangaDetailsRequest = function (ids) {
        var requests = [];
        for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
            var id = ids_1[_i];
            var metadata = { "id": id };
            requests.push(createRequestObject({
                url: RS_DOMAIN + "/comics/" + id,
                metadata: metadata,
                method: "GET"
            }));
        }
        return requests;
    };
    Reaperscans.prototype.getMangaDetails = function (data, metadata) {
        var mangas = [];
        var $ = this.cheerio.load(data);
        var cover = RS_DOMAIN + $("a.media-content").attr("style").replace("background-image:url(", "").replace(")", "").toString();
        var title = $("h5.text-highlight").first().text().trim();
        // TODO: Implement isAdult check
        var description = $("div.col-lg-9")
            .clone()
            .children()
            .remove()
            .end()
            .text()
            .trim();
        var status = paperback_extensions_common_1.MangaStatus.ONGOING;
        var titles = [];
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
            desc: description,
            hentai: false
        }));
        return mangas;
    };
    Reaperscans.prototype.getChaptersRequest = function (mangaId) {
        return createRequestObject({
            url: RS_DOMAIN + "/comics/" + mangaId,
            method: "GET",
            metadata: { mangaId: mangaId }
        });
    };
    Reaperscans.prototype.getChapters = function (data, metadata) {
        var $ = this.cheerio.load(data);
        var chapters = [];
        var rawChapters = $("div.list-item.col-sm-3").toArray();
        for (var _i = 0, rawChapters_1 = rawChapters; _i < rawChapters_1.length; _i++) {
            var element = rawChapters_1[_i];
            var title = $("div.flex", element).children().first().text().trim();
            var chapterNumbers = $("div.flex a.item-author", element).attr("href").replace(RS_DOMAIN + "/comics/" + metadata.mangaId + "/", "").split("/");
            var chapterId = chapterNumbers[1];
            var chapterNumber = parseInt(chapterNumbers[1]);
            var volume = parseInt(chapterNumbers[0]);
            chapters.push(createChapter({
                id: chapterId,
                mangaId: metadata.mangaId,
                time: undefined,
                name: title,
                langCode: paperback_extensions_common_1.LanguageCode.ENGLISH,
                chapNum: chapterNumber,
                volume: volume
            }));
        }
        return chapters;
    };
    Reaperscans.prototype.getChapterDetailsRequest = function (mangaId, chapId) {
        return createRequestObject({
            url: RS_DOMAIN + "/comics/" + mangaId + "/1/" + chapId,
            method: "GET",
            metadata: { mangaId: mangaId, chapId: chapId }
        });
    };
    Reaperscans.prototype.getChapterDetails = function (data, metadata) {
        var $ = this.cheerio.load(data);
        var script = $("script").get();
        var pages = [];
        var toBeEvaledRaw = "";
        for (var _i = 0, script_1 = script; _i < script_1.length; _i++) {
            var i = script_1[_i];
            if (i["children"][0] !== undefined) {
                if (i["children"][0]["data"].includes("window.chapterPages")) {
                    toBeEvaledRaw = i["children"][0]["data"].split("window.slug = \"" + metadata.mangaId + "\";")[1];
                }
            }
        }
        var toBeEvaled = toBeEvaledRaw
            .split("window.nextChapter")[0]
            .replace("window.chapterPages", "let chapPages");
        toBeEvaled += "new Array(chapPages)";
        var evaled = eval(toBeEvaled)[0];
        for (var _a = 0, evaled_1 = evaled; _a < evaled_1.length; _a++) {
            var part = evaled_1[_a];
            pages.push("https://reaperscans.com" + part);
        }
        var chapterDetails = createChapterDetails({
            id: metadata.chapId,
            mangaId: metadata.mangaId,
            pages: pages,
            longStrip: false
        });
        return chapterDetails;
    };
    Reaperscans.prototype.searchRequest = function (query, page) {
        return createRequestObject({
            url: RS_DOMAIN + "/comics?query=" + escape(query.title.replace(" ", "+")),
            method: "GET"
        });
    };
    Reaperscans.prototype.search = function (data) {
        var $ = this.cheerio.load(data);
        var mangas = [];
        $("div.list-item").each(function (index, manga) {
            var chapterIdRaw = $("div.list-content div.list-body a", manga).attr("href").split("/");
            var chapterIdClean = chapterIdRaw.filter(function (i) {
                return i != "" && i != null;
            });
            var chapterId = "";
            if (chapterIdClean && chapterIdClean.length > 1) {
                chapterId = chapterIdClean.pop().toString();
            }
            var title = $("div.list-content div.list-body a", manga).text().trim();
            var tag = $("div.media a", manga).attr("style").match(/\((.*?)\)/);
            var image = RS_DOMAIN + tag[1];
            mangas.push(createMangaTile({
                id: chapterId,
                image: image,
                title: createIconText({ text: title !== null && title !== void 0 ? title : "" })
            }));
        });
        return mangas;
    };
    return Reaperscans;
}(paperback_extensions_common_1.Source));
exports.Reaperscans = Reaperscans;
