import { Source, Manga, MangaStatus, Chapter, ChapterDetails, HomeSectionRequest, HomeSection, MangaTile, SearchRequest, LanguageCode, TagSection, Request, MangaUpdates } from "paperback-extensions-common"

const RS_DOMAIN = "http://saky-paperback.ml/extension";

export class Reaperscans extends Source{

    constructor(cheerio: CheerioAPI){
        super(cheerio);
    }

    get version(): string {
        return "1.2"; 
    }
    get name(): string {
        return "Reaperscans";
    }
    get icon(): string {
        return "icon.png"; 
    }
    get author(): string {
        return "Saky"; 
    }
    get description(): string {
        return "Extension that pulls manga from reaper scans";
    }
    get hentaiSource(): boolean {
        return false;
    }

    getMangaDetailsRequest(ids: string[]): Request[]{
        let requests: Request[] = [];
        for(let id of ids){
            let metadata = {"id": id};
            requests.push(createRequestObject({
                url:`${RS_DOMAIN}/mangaDetails.php?mangaID=${id}`,
                metadata:metadata,
                method:"GET",
            }));
        }
        return requests;
    } 

    getMangaDetails(data: any, metadata: any): Manga[]{
        let mangas: Manga[] = [];

        let json = JSON.parse(data);

        let title = json["title"];
        let desc = json["desc"];
        let cover = json["cover"];
        let isAdult = json["isAdult"]

        let status = MangaStatus.ONGOING;
        let titles = [];

        titles.push(title);

        mangas.push(createManga({
            id:metadata.id,
            titles:titles,
            image:cover,
            rating:0,
            status:status,
            author:"Unknown",
            artist:"Unknown",
            tags: [],
            desc:desc,
            hentai:isAdult
        }));

        return mangas;
    }

    getChaptersRequest(mangaId: string): Request{
        return createRequestObject({
            url:`${RS_DOMAIN}/chapters.php?mangaID=${mangaId}`,
            method:"GET",
            metadata:{mangaId},
        });
    }

    getChapters(data:any, metadata:any): Chapter[] {
        let chapters: Chapter[] = [];
    
        let json = JSON.parse(data);

        let i:number;
        for(i = 0; i < json.length; i++){
            chapters.push(createChapter({
                id:json[i]["chapterID"],
                mangaId:metadata.mangaId,
                time:undefined,
                name:json[i]["chapterTitle"],
                langCode:LanguageCode.ENGLISH,
                chapNum:json[i]["chapterNum"],
                volume:json[i]["volume"]
            }))
        }

        return chapters;
    }

    getChapterDetailsRequest(mangaId: string, chapId: string): Request {
        return createRequestObject({
            url:`${RS_DOMAIN}/chapterDetails.php?mangaID=${mangaId}&chapID=${chapId}`,
            method:"GET",
            metadata:{mangaId, chapId},
        });
    }

    getChapterDetails(data: any, metadata: any): ChapterDetails {
        let pages: string[] = [];
        
        let json = JSON.parse(data);

        let i: number;
        for(i=0; i < json.length; i++){
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

      searchRequest(query: SearchRequest, page: number): Request | null {
        return createRequestObject({
            url:`${RS_DOMAIN}/search.php?q=${escape(query.title.replace(" ","+"))}`,
            method:"GET",
          });
      }

      search(data: any): MangaTile[] | null {
        let mangas: MangaTile[] = [];

        let json = JSON.parse(data);

        let i: number;
        for(i = 0; i < json.length; i++){
            mangas.push(createMangaTile({
                id:json[i]["mangaID"],
                image:json[i]["cover"],
                title:createIconText({text:json[i]["title"] ?? ""})
            }));
        }

        return mangas;

      }
    
}

