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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reaperscans = void 0;
var paperback_extensions_common_1 = require("paperback-extensions-common");
var RS_DOMAIN = "http://saky-paperback.ml/extension";
var Reaperscans = /** @class */ (function (_super) {
    __extends(Reaperscans, _super);
    function Reaperscans(cheerio) {
        return _super.call(this, cheerio) || this;
    }
    Object.defineProperty(Reaperscans.prototype, "version", {
        get: function () {
            return "1.3";
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
                url: RS_DOMAIN + "/mangaDetails.php?mangaID=" + id,
                metadata: metadata,
                method: "GET",
            }));
        }
        return requests;
    };
    Reaperscans.prototype.getMangaDetails = function (data, metadata) {
        var mangas = [];
        var json = JSON.parse(data);
        var title = json["title"];
        var desc = json["desc"];
        var cover = json["cover"];
        var isAdult = json["isAdult"];
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
            desc: desc,
            hentai: isAdult
        }));
        return mangas;
    };
    Reaperscans.prototype.getChaptersRequest = function (mangaId) {
        return createRequestObject({
            url: RS_DOMAIN + "/chapters.php?mangaID=" + mangaId,
            method: "GET",
            metadata: { mangaId: mangaId },
        });
    };
    Reaperscans.prototype.getChapters = function (data, metadata) {
        var chapters = [];
        var json = JSON.parse(data);
        var i;
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
    };
    Reaperscans.prototype.getChapterDetailsRequest = function (mangaId, chapId) {
        return createRequestObject({
            url: RS_DOMAIN + "/chapterDetails.php?mangaID=" + mangaId + "&chapID=" + chapId,
            method: "GET",
            metadata: { mangaId: mangaId, chapId: chapId },
        });
    };
    Reaperscans.prototype.getChapterDetails = function (data, metadata) {
        var pages = [];
        var json = JSON.parse(data);
        var i;
        for (i = 0; i < json.length; i++) {
            pages.push(json[i]);
        }
        var chapterDetails = createChapterDetails({
            id: metadata.chapId,
            mangaId: metadata.mangaId,
            pages: pages,
            longStrip: true,
        });
        return chapterDetails;
    };
    Reaperscans.prototype.searchRequest = function (query, page) {
        var _a;
        return createRequestObject({
            url: RS_DOMAIN + "/search.php?q=" + escape((_a = query.title) === null || _a === void 0 ? void 0 : _a.replace(" ", "+")),
            method: "GET",
        });
    };
    Reaperscans.prototype.search = function (data) {
        var _a;
        var mangas = [];
        var json = JSON.parse(data);
        var i;
        for (i = 0; i < json.length; i++) {
            mangas.push(createMangaTile({
                id: json[i]["mangaID"],
                image: json[i]["cover"],
                title: createIconText({ text: (_a = json[i]["title"]) !== null && _a !== void 0 ? _a : "" })
            }));
        }
        return mangas;
    };
    return Reaperscans;
}(paperback_extensions_common_1.Source));
exports.Reaperscans = Reaperscans;
