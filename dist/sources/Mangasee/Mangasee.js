"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mangasee = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const MS_DOMAIN = 'https://mangasee123.com';
class Mangasee extends paperback_extensions_common_1.Source {
    constructor(cheerio) {
        super(cheerio);
    }
    get version() { return '1.1.2'; }
    get name() { return 'Mangasee'; }
    get icon() { return 'icon.png'; }
    get author() { return 'Daniel Kovalevich'; }
    get authorWebsite() { return 'https://github.com/DanielKovalevich'; }
    get description() { return 'Extension that pulls manga from MangaLife, includes Advanced Search and Updated manga fetching'; }
    get hentaiSource() { return false; }
    getMangaShareUrl(mangaId) { return `${MS_DOMAIN}/manga/${mangaId}`; }
    getMangaDetailsRequest(ids) {
        let requests = [];
        for (let id of ids) {
            let metadata = { 'id': id };
            requests.push(createRequestObject({
                url: `${MS_DOMAIN}/manga/`,
                metadata: metadata,
                method: 'GET',
                param: id
            }));
        }
        return requests;
    }
    getMangaDetails(data, metadata) {
        var _a, _b, _c, _d, _e;
        let manga = [];
        let $ = this.cheerio.load(data);
        let json = JSON.parse((_b = (_a = $('[type=application\\/ld\\+json]').html()) === null || _a === void 0 ? void 0 : _a.replace(/\t*\n*/g, '')) !== null && _b !== void 0 ? _b : '');
        let entity = json.mainEntity;
        let info = $('.row');
        let image = `https://cover.mangabeast01.com/cover/${metadata.id}.jpg`;
        let title = (_c = $('h1', info).first().text()) !== null && _c !== void 0 ? _c : '';
        let titles = [title];
        let author = entity.author[0];
        titles = titles.concat(entity.alternateName);
        let follows = Number(((_e = (_d = $.root().html()) === null || _d === void 0 ? void 0 : _d.match(/vm.NumSubs = (.*);/)) !== null && _e !== void 0 ? _e : [])[1]);
        let tagSections = [createTagSection({ id: '0', label: 'genres', tags: [] }),
            createTagSection({ id: '1', label: 'format', tags: [] })];
        tagSections[0].tags = entity.genre.map((elem) => createTag({ id: elem, label: elem }));
        let update = entity.dateModified;
        let status = paperback_extensions_common_1.MangaStatus.ONGOING;
        let summary = '';
        let hentai = entity.genre.includes('Hentai') || entity.genre.includes('Adult');
        let details = $('.list-group', info);
        for (let row of $('li', details).toArray()) {
            let text = $('.mlabel', row).text();
            switch (text) {
                case 'Type:': {
                    let type = $('a', row).text();
                    tagSections[1].tags.push(createTag({ id: type.trim(), label: type.trim() }));
                    break;
                }
                case 'Status:': {
                    status = $(row).text().includes('Ongoing') ? paperback_extensions_common_1.MangaStatus.ONGOING : paperback_extensions_common_1.MangaStatus.COMPLETED;
                    break;
                }
                case 'Description:': {
                    summary = $('div', row).text().trim();
                    break;
                }
            }
        }
        manga.push(createManga({
            id: metadata.id,
            titles: titles,
            image: image,
            rating: 0,
            status: status,
            author: author,
            tags: tagSections,
            desc: summary,
            hentai: hentai,
            follows: follows,
            lastUpdate: update
        }));
        return manga;
    }
    getChaptersRequest(mangaId) {
        let metadata = { 'id': mangaId };
        return createRequestObject({
            url: `${MS_DOMAIN}/manga/`,
            method: "GET",
            metadata: metadata,
            headers: {
                "content-type": "application/x-www-form-urlencoded"
            },
            param: mangaId
        });
    }
    getChapters(data, metadata) {
        var _a, _b;
        let $ = this.cheerio.load(data);
        let chapterJS = JSON.parse(((_b = (_a = $.root().html()) === null || _a === void 0 ? void 0 : _a.match(/vm.Chapters = (.*);/)) !== null && _b !== void 0 ? _b : [])[1]).reverse();
        let chapters = [];
        // following the url encoding that the website uses, same variables too
        chapterJS.forEach((elem) => {
            let chapterCode = elem.Chapter;
            let vol = Number(chapterCode.substring(0, 1));
            let index = vol != 1 ? '-index-' + vol : '';
            let n = parseInt(chapterCode.slice(1, -1));
            let a = Number(chapterCode[chapterCode.length - 1]);
            let m = a != 0 ? '.' + a : '';
            let id = metadata.id + '-chapter-' + n + m + index + '.html';
            let chNum = n + a * .1;
            let name = elem.ChapterName ? elem.ChapterName : ''; // can be null
            let time = Date.parse(elem.Date.replace(" ", "T"));
            chapters.push(createChapter({
                id: id,
                mangaId: metadata.id,
                name: name,
                chapNum: chNum,
                langCode: paperback_extensions_common_1.LanguageCode.ENGLISH,
                time: isNaN(time) ? new Date() : new Date(time)
            }));
        });
        return chapters;
    }
    getChapterDetailsRequest(mangaId, chapId) {
        let metadata = { 'mangaId': mangaId, 'chapterId': chapId, 'nextPage': false, 'page': 1 };
        return createRequestObject({
            url: `${MS_DOMAIN}/read-online/`,
            metadata: metadata,
            headers: {
                "content-type": "application/x-www-form-urlencoded"
            },
            method: 'GET',
            param: chapId
        });
    }
    getChapterDetails(data, metadata) {
        var _a, _b;
        let pages = [];
        let pathName = JSON.parse(((_a = data.match(/vm.CurPathName = (.*);/)) !== null && _a !== void 0 ? _a : [])[1]);
        let chapterInfo = JSON.parse(((_b = data.match(/vm.CurChapter = (.*);/)) !== null && _b !== void 0 ? _b : [])[1]);
        let pageNum = Number(chapterInfo.Page);
        let chapter = chapterInfo.Chapter.slice(1, -1);
        let odd = chapterInfo.Chapter[chapterInfo.Chapter.length - 1];
        let chapterImage = odd == 0 ? chapter : chapter + '.' + odd;
        for (let i = 0; i < pageNum; i++) {
            let s = '000' + (i + 1);
            let page = s.substr(s.length - 3);
            pages.push(`https://${pathName}/manga/${metadata.mangaId}/${chapterInfo.Directory == '' ? '' : chapterInfo.Directory + '/'}${chapterImage}-${page}.png`);
        }
        let chapterDetails = createChapterDetails({
            id: metadata.chapterId,
            mangaId: metadata.mangaId,
            pages, longStrip: false
        });
        return chapterDetails;
    }
    filterUpdatedMangaRequest(ids, time, page) {
        let metadata = { 'ids': ids, 'referenceTime': time };
        return createRequestObject({
            url: `${MS_DOMAIN}/`,
            metadata: metadata,
            headers: {
                "content-type": "application/x-www-form-urlencoded"
            },
            method: "GET"
        });
    }
    filterUpdatedManga(data, metadata) {
        var _a;
        let $ = this.cheerio.load(data);
        let returnObject = {
            'ids': [],
            'moreResults': false
        };
        let updateManga = JSON.parse(((_a = data.match(/vm.LatestJSON = (.*);/)) !== null && _a !== void 0 ? _a : [])[1]);
        updateManga.forEach((elem) => {
            if (metadata.ids.includes(elem.IndexName) && metadata.referenceTime < new Date(elem.Date))
                returnObject.ids.push(elem.IndexName);
        });
        return createMangaUpdates(returnObject);
    }
    searchRequest(query, page) {
        let status = "";
        switch (query.status) {
            case 0:
                status = 'Completed';
                break;
            case 1:
                status = 'Ongoing';
                break;
            default: status = '';
        }
        let genre = query.includeGenre ?
            (query.includeDemographic ? query.includeGenre.concat(query.includeDemographic) : query.includeGenre) :
            query.includeDemographic;
        let genreNo = query.excludeGenre ?
            (query.excludeDemographic ? query.excludeGenre.concat(query.excludeDemographic) : query.excludeGenre) :
            query.excludeDemographic;
        let metadata = {
            'keyword': query.title,
            'author': query.author || query.artist || '',
            'status': status,
            'type': query.includeFormat,
            'genre': genre,
            'genreNo': genreNo
        };
        return createRequestObject({
            url: `${MS_DOMAIN}/search/`,
            metadata: metadata,
            headers: {
                "content-type": "application/x-www-form-urlencoded"
            },
            method: "GET"
        });
    }
    search(data, metadata) {
        var _a;
        let $ = this.cheerio.load(data);
        let mangaTiles = [];
        let directory = JSON.parse(((_a = data.match(/vm.Directory = (.*);/)) !== null && _a !== void 0 ? _a : [])[1]);
        directory.forEach((elem) => {
            let mKeyword = typeof metadata.keyword !== 'undefined' ? false : true;
            let mAuthor = metadata.author !== '' ? false : true;
            let mStatus = metadata.status !== '' ? false : true;
            let mType = typeof metadata.type !== 'undefined' && metadata.type.length > 0 ? false : true;
            let mGenre = typeof metadata.genre !== 'undefined' && metadata.genre.length > 0 ? false : true;
            let mGenreNo = typeof metadata.genreNo !== 'undefined' ? true : false;
            if (!mKeyword) {
                let allWords = [elem.s.toLowerCase()].concat(elem.al.map((e) => e.toLowerCase()));
                allWords.forEach((key) => {
                    if (key.includes(metadata.keyword.toLowerCase()))
                        mKeyword = true;
                });
            }
            if (!mAuthor) {
                let authors = elem.a.map((e) => e.toLowerCase());
                if (authors.includes(metadata.author.toLowerCase()))
                    mAuthor = true;
            }
            if (!mStatus) {
                if ((elem.ss == 'Ongoing' && metadata.status == 'Ongoing') || (elem.ss != 'Ongoing' && metadata.ss != 'Ongoing'))
                    mStatus = true;
            }
            if (!mType)
                mType = metadata.type.includes(elem.t);
            if (!mGenre)
                mGenre = metadata.genre.every((i) => elem.g.includes(i));
            if (mGenreNo)
                mGenreNo = metadata.genreNo.every((i) => elem.g.includes(i));
            if (mKeyword && mAuthor && mStatus && mType && mGenre && !mGenreNo) {
                mangaTiles.push(createMangaTile({
                    id: elem.i,
                    title: createIconText({ text: elem.s }),
                    image: `https://cover.mangabeast01.com/cover/${elem.i}.jpg`,
                    subtitleText: createIconText({ text: elem.ss })
                }));
            }
        });
        return mangaTiles;
    }
    getTagsRequest() {
        return createRequestObject({
            url: `${MS_DOMAIN}/search/`,
            method: 'GET',
            headers: {
                "content-type": "application/x-www-form-urlencoded",
            }
        });
    }
    getTags(data) {
        var _a, _b, _c;
        let tagSections = [createTagSection({ id: '0', label: 'genres', tags: [] }),
            createTagSection({ id: '1', label: 'format', tags: [] })];
        let genres = JSON.parse(((_a = data.match(/"Genre"\s*: (.*)/)) !== null && _a !== void 0 ? _a : [])[1].replace(/'/g, "\""));
        let typesHTML = ((_b = data.match(/"Type"\s*: (.*),/g)) !== null && _b !== void 0 ? _b : [])[1];
        let types = JSON.parse(((_c = typesHTML.match(/(\[.*\])/)) !== null && _c !== void 0 ? _c : [])[1].replace(/'/g, "\""));
        tagSections[0].tags = genres.map((e) => createTag({ id: e, label: e }));
        tagSections[1].tags = types.map((e) => createTag({ id: e, label: e }));
        return tagSections;
    }
    getHomePageSectionRequest() {
        let request = createRequestObject({ url: `${MS_DOMAIN}`, method: 'GET' });
        let section1 = createHomeSection({ id: 'hot_update', title: 'HOT UPDATES' });
        let section2 = createHomeSection({ id: 'latest', title: 'LATEST UPDATES' });
        let section3 = createHomeSection({ id: 'new_titles', title: 'NEW TITLES' });
        let section4 = createHomeSection({ id: 'recommended', title: 'RECOMMENDATIONS' });
        return [createHomeSectionRequest({ request: request, sections: [section1, section2, section3, section4] })];
    }
    getHomePageSections(data, sections) {
        var _a, _b, _c, _d;
        let hot = (JSON.parse(((_a = data.match(/vm.HotUpdateJSON = (.*);/)) !== null && _a !== void 0 ? _a : [])[1])).slice(0, 15);
        let latest = (JSON.parse(((_b = data.match(/vm.LatestJSON = (.*);/)) !== null && _b !== void 0 ? _b : [])[1])).slice(0, 15);
        let newTitles = (JSON.parse(((_c = data.match(/vm.NewSeriesJSON = (.*);/)) !== null && _c !== void 0 ? _c : [])[1])).slice(0, 15);
        let recommended = JSON.parse(((_d = data.match(/vm.RecommendationJSON = (.*);/)) !== null && _d !== void 0 ? _d : [])[1]);
        let hotManga = [];
        hot.forEach((elem) => {
            let id = elem.IndexName;
            let title = elem.SeriesName;
            let image = `https://cover.mangabeast01.com/cover/${id}.jpg`;
            let time = (new Date(elem.Date)).toDateString();
            time = time.slice(0, time.length - 5);
            time = time.slice(4, time.length);
            hotManga.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({ text: title }),
                secondaryText: createIconText({ text: time, icon: 'clock.fill' })
            }));
        });
        let latestManga = [];
        latest.forEach((elem) => {
            let id = elem.IndexName;
            let title = elem.SeriesName;
            let image = `https://cover.mangabeast01.com/cover/${id}.jpg`;
            let time = (new Date(elem.Date)).toDateString();
            time = time.slice(0, time.length - 5);
            time = time.slice(4, time.length);
            latestManga.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({ text: title }),
                secondaryText: createIconText({ text: time, icon: 'clock.fill' })
            }));
        });
        let newManga = [];
        newTitles.forEach((elem) => {
            let id = elem.IndexName;
            let title = elem.SeriesName;
            let image = `https://cover.mangabeast01.com/cover/${id}.jpg`;
            newManga.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({ text: title })
            }));
        });
        let recManga = [];
        recommended.forEach((elem) => {
            let id = elem.IndexName;
            let title = elem.SeriesName;
            let image = `https://cover.mangabeast01.com/cover/${id}.jpg`;
            let time = (new Date(elem.Date)).toDateString();
            recManga.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({ text: title })
            }));
        });
        sections[0].items = hotManga;
        sections[1].items = latestManga;
        sections[2].items = newManga;
        sections[3].items = recManga;
        return sections;
    }
    getViewMoreRequest(key, page) {
        return createRequestObject({
            url: MS_DOMAIN,
            method: 'GET'
        });
    }
    getViewMoreItems(data, key) {
        var _a, _b, _c;
        let manga = [];
        if (key == 'hot_update') {
            let hot = JSON.parse(((_a = data.match(/vm.HotUpdateJSON = (.*);/)) !== null && _a !== void 0 ? _a : [])[1]);
            hot.forEach((elem) => {
                let id = elem.IndexName;
                let title = elem.SeriesName;
                let image = `https://cover.mangabeast01.com/cover/${id}.jpg`;
                let time = (new Date(elem.Date)).toDateString();
                time = time.slice(0, time.length - 5);
                time = time.slice(4, time.length);
                manga.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({ text: title }),
                    secondaryText: createIconText({ text: time, icon: 'clock.fill' })
                }));
            });
        }
        else if (key == 'latest') {
            let latest = JSON.parse(((_b = data.match(/vm.LatestJSON = (.*);/)) !== null && _b !== void 0 ? _b : [])[1]);
            latest.forEach((elem) => {
                let id = elem.IndexName;
                let title = elem.SeriesName;
                let image = `https://cover.mangabeast01.com/cover/${id}.jpg`;
                let time = (new Date(elem.Date)).toDateString();
                time = time.slice(0, time.length - 5);
                time = time.slice(4, time.length);
                manga.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({ text: title }),
                    secondaryText: createIconText({ text: time, icon: 'clock.fill' })
                }));
            });
        }
        else if (key == 'new_titles') {
            let newTitles = JSON.parse(((_c = data.match(/vm.NewSeriesJSON = (.*);/)) !== null && _c !== void 0 ? _c : [])[1]);
            newTitles.forEach((elem) => {
                let id = elem.IndexName;
                let title = elem.SeriesName;
                let image = `https://cover.mangabeast01.com/cover/${id}.jpg`;
                let time = (new Date(elem.Date)).toDateString();
                time = time.slice(0, time.length - 5);
                time = time.slice(4, time.length);
                manga.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({ text: title })
                }));
            });
        }
        else
            return null;
        return manga;
    }
}
exports.Mangasee = Mangasee;
