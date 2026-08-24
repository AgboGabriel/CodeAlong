import dotenv from "dotenv";
import axios from "axios";
import trustedChannelModel
from "../models/trustedChannelModel.js";
import database from "../config/database.js";
import {
    inferLanguageFromText,
    isGenericTopicTitle,
    textMentionsDifferentSupportedLanguage,
    textMentionsLanguage,
} from "./languageContext.js";
dotenv.config();

const LOW_QUALITY_VIDEO_KEYWORDS = [
    "prank",
    "meme",
    "funny",
    "shorts",
    "#shorts",
    "edit",
    "tiktok",
    "reaction",
    "skit",
    "comedy",
    "joke",
    "watch this before",
    "must watch",
    "don't make this mistake",
    "rant",
    "roast",
    "vlog",
];

const TOPIC_STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "for",
    "from",
    "in",
    "of",
    "the",
    "to",
    "using",
    "with",
]);

function getVideoText(video) {
    return `${video.title || ""} ${video.description || ""}`.toLowerCase();
}

function getTopicTerms(topic) {
    const terms = String(topic || "")
        .toLowerCase()
        .split(/[^a-z0-9+#]+/)
        .filter((term) => term.length > 2 && !TOPIC_STOP_WORDS.has(term));

    // Keep the most specific form of singular/plural duplicates, so
    // "Functions and Function Parameters" requires both concept areas.
    return [...new Set(terms)].filter(
        (term, _index, allTerms) =>
            !allTerms.some((otherTerm) => otherTerm !== term && term.startsWith(otherTerm))
    );
}

function hasTopicMatch(text, normalizedTopic, topicTerms) {
    if (text.includes(normalizedTopic)) {
        return true;
    }

    // Long curriculum titles often do not appear verbatim in a video's
    // metadata. Requiring two meaningful terms still keeps the video tied to
    // the topic while allowing natural titles such as "Function Parameters".
    const requiredMatches = topicTerms.length <= 2 ? topicTerms.length : 2;
    return topicTerms.filter((term) => text.includes(term)).length >= requiredMatches;
}

function applyQualityPenalty(score, text) {
    if (LOW_QUALITY_VIDEO_KEYWORDS.some((keyword) => text.includes(keyword))) {
        return score - 7000;
    }

    return score;
}

function applyLanguageScore(score, text, expectedLanguage) {
    if (!expectedLanguage?.key) {
        return score;
    }

    let nextScore = score;

    if (textMentionsLanguage(text, expectedLanguage.key)) {
        nextScore += 6000;
    }

    if (textMentionsDifferentSupportedLanguage(text, expectedLanguage.key)) {
        nextScore -= 9000;
    }

    return nextScore;
}

function isVideoCompatibleWithLanguage(video, expectedLanguage) {
    if (!expectedLanguage?.key) {
        return true;
    }

    const text = getVideoText(video);
    return (
        textMentionsLanguage(text, expectedLanguage.key) ||
        !textMentionsDifferentSupportedLanguage(text, expectedLanguage.key)
    );
}

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
    async rankVideos(videos, topic, options = {}) {

    const normalizedTopic =
        topic.toLowerCase();
    const topicTerms = getTopicTerms(topic);
    const expectedLanguage = options.expectedLanguage || null;
    const blacklist = await database.query("SELECT video_id FROM blacklisted_videos");
    const excludedVideoIds = new Set([...(options.excludedVideoIds || []), ...blacklist.rows.map((row) => row.video_id)]);
    const requireTopicMatch = options.requireTopicMatch !== false;
    const focusTerms = (options.focusTerms || [])
        .map((term) => String(term).toLowerCase())
        .filter(Boolean);

    // pull trusted channels from DB
    const trustedChannels =
        await trustedChannelModel.getAllTrustedChannels();

    return videos
        .filter((video) => !excludedVideoIds.has(video.videoId || video.video_id))
        .filter((video) => {
            const text = getVideoText(video);

            if (requireTopicMatch && !hasTopicMatch(text, normalizedTopic, topicTerms)) {
                return false;
            }

            if (LOW_QUALITY_VIDEO_KEYWORDS.some((keyword) => text.includes(keyword))) {
                return false;
            }

            if (
                expectedLanguage?.key &&
                textMentionsDifferentSupportedLanguage(text, expectedLanguage.key)
            ) {
                return false;
            }

            return true;
        })
        .map((video) => {

            const title =
                video.title.toLowerCase();

            const description =
                (video.description || "")
                    .toLowerCase();

            const text =
                `${title} ${description}`;

            let score = 0;

            // Strong topic relevance
            if (
                title.includes(normalizedTopic)
            ) {
                score += 5000;
            }

            // Smaller bonus if topic appears
            // only in description
            else if (
                text.includes(normalizedTopic)
            ) {
                score += 2000;
            }

            // tutorial / educational boosts
            if (
                text.includes("tutorial")
            ) {
                score += 1000;
            }

            if (
                text.includes("course")
            ) {
                score += 800;
            }

            if (
                text.includes("full course")
            ) {
                score += 1500;
            }

            if (
                text.includes("beginner")
            ) {
                score += 500;
            }

            // When a learner repeatedly fails, prefer videos that explicitly
            // teach the type of problem found in their last submission.
            for (const focusTerm of focusTerms) {
                if (text.includes(focusTerm)) score += 900;
            }

            score = applyQualityPenalty(score, text);
            score = applyLanguageScore(score, text, expectedLanguage);

            // Trusted channel boost
           const trustedChannel =
            trustedChannels.find(
                (channel) =>
                    channel.channel_name ===
                    video.channelTitle
            );

            if (trustedChannel) {
                score += trustedChannel.trust_score || 4000;
            }

            // popularity
            score +=
                Math.log10(
                    video.viewCount + 1
                ) * 100;

            score +=
                Math.log10(
                    video.likeCount + 1
                ) * 100;

            return {
                ...video,
                score,
            };
        })
        .sort((a, b) => b.score - a.score);
}
    async getRecommendedVideos({
        careerPath,
        skillLevel,
        knownLanguages = [],
        learningLanguages = [],
        }) {

        const recommendations = [];

        // prioritize learning languages first
        const primaryLanguages =
            learningLanguages.length > 0
            ? learningLanguages
            : knownLanguages;

        for (const language of primaryLanguages.slice(0, 3)) {

            const query =
            `${language} ${careerPath} ${skillLevel} tutorial -skit -shorts -meme -reaction`;

            const candidates =
            await this.searchVideos(query, 12);

            const videoIds = candidates
            .map(video => video.videoId)
            .filter(Boolean);

            const detailedVideos =
            await this.getVideoDetails(videoIds);

            const rankedVideos =
            await this.rankRecommendedVideos(
                detailedVideos,
                {
                careerPath,
                skillLevel,
                language,
                expectedLanguage: inferLanguageFromText(language),
                }
            );

            recommendations.push({
            language,
            query,
            videos: rankedVideos.slice(0, 5),
            });
        }

        return recommendations;
        }
        async rankRecommendedVideos(
        videos,
        {
            careerPath,
            skillLevel,
            language,
            expectedLanguage,
        }
        ) {

        const trustedChannels = await trustedChannelModel.getAllTrustedChannels();

        return videos
            .map((video) => {

            const title =
                video.title.toLowerCase();

            const description =
                (video.description || "")
                .toLowerCase();

            const text =
                `${title} ${description}`;

            let score = 0;

            // Language relevance
            if (
                text.includes(language.toLowerCase())
            ) {
                score += 3000;
            }

            score = applyLanguageScore(score, text, expectedLanguage);
            score = applyQualityPenalty(score, text);

            // Skill level
            if (
                skillLevel === "beginner" &&
                (
                text.includes("beginner") ||
                text.includes("crash course") ||
                text.includes("full course")
                )
            ) {
                score += 2000;
            }

            // Career path
            if (
                careerPath === "frontend" &&
                (
                text.includes("react") ||
                text.includes("frontend") ||
                text.includes("ui")
                )
            ) {
                score += 1000;
            }

            // Trusted channels
            const trustedChannel =
            trustedChannels.find(
                (channel) =>
                channel.channel_name ===
                video.channelTitle
            );

            if (trustedChannel) {
            score += trustedChannel.trust_score;
            }

            // Popularity
            score +=
                Math.log10(video.viewCount + 1) * 100;

            score +=
                Math.log10(video.likeCount + 1) * 100;

            return {
                ...video,
                score,
            };

            })
            .sort((a, b) => b.score - a.score);
        }
    async findBestVideoForTopic({
        moduleTitle,
        topic,
        skillLevel,
        careerPath,
        expectedLanguage = null,
        excludedVideoIds = [],
    }) {
       
        const languageLabel = expectedLanguage?.name || expectedLanguage?.key || "";
        const queryTopic = isGenericTopicTitle(topic) && languageLabel
            ? `${languageLabel} ${topic}`
            : topic;
        const query =
                `${languageLabel} ${queryTopic} tutorial ${moduleTitle} ${skillLevel || ""} -skit -shorts -meme -reaction`;

        const candidates = await this.searchVideos(query, 12);
        const videoIds = candidates.map((video) => video.videoId).filter(Boolean);

        const detailedVideos = await this.getVideoDetails(videoIds);
        const rankedVideos =await  this.rankVideos(detailedVideos, topic, {
            expectedLanguage,
            excludedVideoIds,
        });

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
      expectedLanguage: inferLanguageFromText(module.title, topic),
    });

    videos.push(result);
  }

  return {
    moduleTitle: module.title,
    videos,
  };
}

  isVideoCompatibleWithLanguage(video, expectedLanguage) {
    return isVideoCompatibleWithLanguage(video, expectedLanguage);
  }

  inferLanguageFromContext(...parts) {
    return inferLanguageFromText(...parts);
  }


}
export default new YoutubeService();
