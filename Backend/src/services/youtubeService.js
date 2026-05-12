import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

class YoutubeService {
    constructor(){
        this.videoUrl = "https://www.googleapis.com/youtube/v3/videos";
        this.apiKey=process.env.YOUTUBE_API_KEY;
        this.searchUrl="https://www.googleapis.com/youtube/v3/search";
        if(!this.apiKey){
            console.warn("Youtube API key is not set. YouTube-related features will not work until Youtube_API_KEY is set in .env.");
        }

    }
    async searchVideos(query, maxResults = 5) {
        try{
            if(!this.apiKey){
                throw new Error("YouTube API key is not configured. Set Youtube_API_KEY in .env.");
            }
            if(!query.trim()){
                throw new Error("Search query cannot be empty.");
            }
            const response =await axios.get(this.searchUrl, {
                params: {
                    part: "snippet",
                    key: this.apiKey,
                    q: query,
                    type: "video",
                    maxResults: maxResults,
                    safeSearch: "moderate",
                    videoEmbeddable: "true",
                    relevanceLanguage: "en",
                }
            });
        return response.data.items.map((item) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails?.medium?.url,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            }));    

        }catch(error){
            console.error("Error searching videos:", error);
            throw error;
        }

    }
    async getVideoDetails(videoId){
        if(!videoId.length)return [];
        const response=await axios.get(this.videoUrl, {
            params:{
                part:"snippet,contentDetails,statistics",
                key:this.apiKey,
                id:videoId.join(","),
            }
        });
         return response.data.items.map((item) => ({
        videoId: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.medium?.url,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        viewCount: Number(item.statistics?.viewCount || 0),
        likeCount: Number(item.statistics?.likeCount || 0),
        duration: item.contentDetails?.duration,
  }));
    }
    rankVideos(videos, topic) {
        const normalizedTopic = topic.toLowerCase();
        return videos.map(
            (video) => {
                const title = video.title.toLowerCase();
                const relevanceScore = title.includes(normalizedTopic) ? 1000 : 0;
                const viewScore = Math.log10(video.viewCount + 1)*100;
                const likeScore = Math.log10(video.likeCount + 1)*100;
                return{
                    ...video,
                    score: relevanceScore + viewScore + likeScore,
                };
            })
            .sort((a,b) => b.score - a.score  ); 
            
    }
    async findBestVideoForTopic({ moduleTitle, topic, skillLevel, careerPath }) {
        const query = `${moduleTitle} ${topic} ${skillLevel || ""} ${careerPath || ""} tutorial programming`;

        const candidates = await this.searchVideos(query, 5);
        const videoIds = candidates.map((video) => video.videoId).filter(Boolean);

        const detailedVideos = await this.getVideoDetails(videoIds);
        const rankedVideos = this.rankVideos(detailedVideos, topic);

        return {
            topic,
            query,
            video: rankedVideos[0] || null,
        };
}
async findVideosForModule({ module, skillLevel, careerPath }) {
  const topics = Array.isArray(module.topics)
    ? module.topics.slice(0, 5)
    : [];

  const videos = [];

  for (const topic of topics) {
    const result = await this.findBestVideoForTopic({
      moduleTitle: module.title,
      topic,
      skillLevel,
      careerPath,
    });

    videos.push(result);
  }

  return {
    moduleTitle: module.title,
    videos,
  };
}


}
export default new YoutubeService();