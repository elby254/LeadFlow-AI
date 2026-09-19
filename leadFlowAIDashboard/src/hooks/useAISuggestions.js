/**
 * ==========================================================
 * Central orchestration hook for AI-powered assistance.
 *
 * This hook DOES NOT contain AI logic.
 * It communicates with the backend AI services and exposes
 * reusable AI suggestions to the UI.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Smart reply suggestions
 * ✓ Property recommendations
 * ✓ Lead qualification insights
 * ✓ Conversation summaries
 * ✓ Follow-up recommendations
 * ✓ Next Best Action
 * ✓ Sentiment insights
 * ✓ Viewing recommendations
 * ✓ Offline fallback
 *
 * Used By
 * ----------------------------------------------------------
 * Agent Conversation Center
 * Viewer Conversation Center
 * Admin Dashboard
 * Lead Details
 * Property Recommendation Panel
 *
 * Backend
 * ----------------------------------------------------------
 * POST /api/ai/replies
 * POST /api/ai/summary
 * POST /api/ai/property-match
 * POST /api/ai/lead-insight
 * POST /api/ai/next-action
 * POST /api/ai/sentiment
 *
 * ==========================================================
 */

import { useState } from "react";
import { useCallback } from "react";

import  useAuth from "./useAuth";

import aiSuggestionService from "../services/aiSuggestionService";

/* ==========================================================
   HOOK
========================================================== */

const useAISuggestions = () => {

  /* ========================================================
     AUTHENTICATION
  ======================================================== */

  const {

    user,

    hasRole,

    hasPermission,

  } = useAuth();

  /* ========================================================
     SMART REPLIES
  ======================================================== */

  const [

    smartReplies,

    setSmartReplies,

  ] = useState([]);

  /* ========================================================
     PROPERTY RECOMMENDATIONS
  ======================================================== */

  const [

    recommendedProperties,

    setRecommendedProperties,

  ] = useState([]);

  /* ========================================================
     LEAD INSIGHTS
  ======================================================== */

  const [

    leadInsight,

    setLeadInsight,

  ] = useState(null);

  /* ========================================================
     CONVERSATION SUMMARY
  ======================================================== */

  const [

    conversationSummary,

    setConversationSummary,

  ] = useState("");

  /* ========================================================
     NEXT BEST ACTION
  ======================================================== */

  const [

    nextBestAction,

    setNextBestAction,

  ] = useState(null);

  /* ========================================================
     SENTIMENT ANALYSIS
  ======================================================== */

  const [

    sentiment,

    setSentiment,

  ] = useState(null);

  /* ========================================================
     FOLLOW-UP SUGGESTIONS
  ======================================================== */

  const [

    followUpSuggestions,

    setFollowUpSuggestions,

  ] = useState([]);

  /* ========================================================
     VIEWING RECOMMENDATIONS
  ======================================================== */

  const [

    viewingSuggestions,

    setViewingSuggestions,

  ] = useState([]);

  /* ========================================================
     AI STATUS
  ======================================================== */

  const [

    aiEnabled,

    setAIEnabled,

  ] = useState(true);

  /* ========================================================
     LOADING
  ======================================================== */

  const [

    loading,

    setLoading,

  ] = useState(false);

  /* ========================================================
     ERROR
  ======================================================== */

  const [

    error,

    setError,

  ] = useState("");

  /* ========================================================
     LAST REQUEST
     Helps avoid duplicate AI requests
  ======================================================== */

  const [

    lastRequest,

    setLastRequest,

  ] = useState(null);

  /* ========================================================
     CLEAR AI RESULTS
     (Implementation continues in Part 2)
  ======================================================== */

  const clearSuggestions = useCallback(() => {

    setSmartReplies([]);

    setRecommendedProperties([]);

    setLeadInsight(null);

    setConversationSummary("");

    setNextBestAction(null);

    setSentiment(null);

    setFollowUpSuggestions([]);

    setViewingSuggestions([]);

    setError("");

  }, []);

  /* ========================================================
     GENERATE SMART REPLIES
  ======================================================== */

  const generateSmartReplies = useCallback(

    async (

      conversationId,

      messages = []

    ) => {

      try {

        setLoading(true);

        setError("");

        const requestKey = JSON.stringify({

          type: "replies",

          conversationId,

          count: messages.length,

        });

        if (lastRequest === requestKey) {

          return smartReplies;

        }

        setLastRequest(requestKey);

        const response =

          await aiSuggestionService.generateSmartReplies({

            conversationId,

            messages,

          });

        const replies =

          response?.suggestions ||

          response?.replies ||

          [];

        setSmartReplies(

          Array.isArray(replies)

            ? replies

            : []

        );

        return replies;

      }

      catch (err) {

        console.error(

          "Failed to generate smart replies",

          err

        );

        setError(

          err?.message ||

          "Unable to generate AI replies."

        );

        return [];

      }

      finally {

        setLoading(false);

      }

    },

    [

      lastRequest,

      smartReplies,

    ]

  );

  /* ========================================================
     GENERATE CONVERSATION SUMMARY
  ======================================================== */

  const generateConversationSummary = useCallback(

    async (

      conversationId,

      messages = []

    ) => {

      try {

        setLoading(true);

        setError("");

        const requestKey = JSON.stringify({

          type: "summary",

          conversationId,

          count: messages.length,

        });

        if (lastRequest === requestKey) {

          return conversationSummary;

        }

        setLastRequest(requestKey);

        const response =

          await aiSuggestionService.generateConversationSummary({

            conversationId,

            messages,

          });

        const summary =

          response?.summary ||

          "";

        setConversationSummary(summary);

        return summary;

      }

      catch (err) {

        console.error(

          "Conversation summary failed",

          err

        );

        setError(

          err?.message ||

          "Unable to summarize conversation."

        );

        return "";

      }

      finally {

        setLoading(false);

      }

    },

    [

      lastRequest,

      conversationSummary,

    ]

  );

  /* ========================================================
     REFRESH AI RESPONSES
  ======================================================== */

  const refreshSuggestions = useCallback(

    async (

      conversationId,

      messages = []

    ) => {

      clearSuggestions();

      await Promise.all([

        generateSmartReplies(

          conversationId,

          messages

        ),

        generateConversationSummary(

          conversationId,

          messages

        ),

      ]);

    },

    [

      clearSuggestions,

      generateSmartReplies,

      generateConversationSummary,

    ]

  );

  /* ========================================================
     PROPERTY RECOMMENDATIONS
  ======================================================== */

  const generatePropertyRecommendations = useCallback(

    async (

      lead,

      properties = []

    ) => {

      try {

        setLoading(true);

        setError("");

        const response =

          await aiSuggestionService.generatePropertyRecommendations({

            lead,

            properties,

          });

        const recommendations =

          response?.recommendations ||

          [];

        setRecommendedProperties(

          Array.isArray(recommendations)

            ? recommendations

            : []

        );

        return recommendations;

      }

      catch (err) {

        console.error(

          "Property recommendation failed",

          err

        );

        setError(

          err?.message ||

          "Unable to generate property recommendations."

        );

        return [];

      }

      finally {

        setLoading(false);

      }

    },

    []

  );

  /* ========================================================
     LEAD INSIGHTS
  ======================================================== */

  const generateLeadInsight = useCallback(

    async (

      lead

    ) => {

      try {

        setLoading(true);

        setError("");

        const response =

          await aiSuggestionService.generateLeadInsight(

            lead

          );

        const insight =

          response?.insight ||

          response ||

          null;

        setLeadInsight(insight);

        return insight;

      }

      catch (err) {

        console.error(

          "Lead insight failed",

          err

        );

        setError(

          err?.message ||

          "Unable to generate lead insight."

        );

        return null;

      }

      finally {

        setLoading(false);

      }

    },

    []

  );

  /* ========================================================
     NEXT BEST ACTION
  ======================================================== */

  const generateNextBestAction = useCallback(

    async (

      lead,

      conversation

    ) => {

      try {

        setLoading(true);

        setError("");

        const response =

          await aiSuggestionService.generateNextBestAction({

            lead,

            conversation,

          });

        const action =

          response?.action ||

          null;

        setNextBestAction(action);

        return action;

      }

      catch (err) {

        console.error(

          "Next Best Action failed",

          err

        );

        setError(

          err?.message ||

          "Unable to generate next action."

        );

        return null;

      }

      finally {

        setLoading(false);

      }

    },

    []

  );

  /* ========================================================
     SENTIMENT ANALYSIS
  ======================================================== */

  const analyzeSentiment = useCallback(

    async (

      messages = []

    ) => {

      try {

        setLoading(true);

        setError("");

        const response =

          await aiSuggestionService.analyzeSentiment({

            messages,

          });

        const analysis =

          response?.sentiment ||

          null;

        setSentiment(analysis);

        return analysis;

      }

      catch (err) {

        console.error(

          "Sentiment analysis failed",

          err

        );

        setError(

          err?.message ||

          "Unable to analyze conversation sentiment."

        );

        return null;

      }

      finally {

        setLoading(false);

      }

    },

    []

  );

  /* ========================================================
     FOLLOW-UP SUGGESTIONS
  ======================================================== */

  const generateFollowUpSuggestions = useCallback(

    async (

      lead

    ) => {

      try {

        setLoading(true);

        setError("");

        const response =

          await aiSuggestionService.generateFollowUpSuggestions(

            lead

          );

        const suggestions =

          response?.suggestions ||

          [];

        setFollowUpSuggestions(

          Array.isArray(suggestions)

            ? suggestions

            : []

        );

        return suggestions;

      }

      catch (err) {

        console.error(

          "Follow-up suggestions failed",

          err

        );

        setError(

          err?.message ||

          "Unable to generate follow-up suggestions."

        );

        return [];

      }

      finally {

        setLoading(false);

      }

    },

    []

  );

  /* ========================================================
     VIEWING RECOMMENDATIONS
  ======================================================== */

  const generateViewingSuggestions = useCallback(

    async (

      lead,

      availability

    ) => {

      try {

        setLoading(true);

        setError("");

        const response =

          await aiSuggestionService.generateViewingSuggestions({

            lead,

            availability,

          });

        const suggestions =

          response?.suggestions ||

          [];

        setViewingSuggestions(

          Array.isArray(suggestions)

            ? suggestions

            : []

        );

        return suggestions;

      }

      catch (err) {

        console.error(

          "Viewing suggestions failed",

          err

        );

        setError(

          err?.message ||

          "Unable to generate viewing suggestions."

        );

        return [];

      }

      finally {

        setLoading(false);

      }

    },

    []

  );

  /* ========================================================
     OFFLINE FALLBACK
     Rule-based suggestions when AI is unavailable
  ======================================================== */

  const generateOfflineSuggestions = useCallback(

    (lead = {}) => {

      const fallbackReplies = [];

      if (lead?.budget && lead?.location) {

        fallbackReplies.push(

          "Thanks for sharing your requirements. I'll recommend matching properties shortly."

        );

      }

      if (lead?.moveInDate) {

        fallbackReplies.push(

          "Would you like to schedule a property viewing this week?"

        );

      }

      if (!lead?.phoneNumber) {

        fallbackReplies.push(

          "Could you share your preferred phone number so an agent can contact you?"

        );

      }

      setSmartReplies(fallbackReplies);

      return fallbackReplies;

    },

    []

  );

  /* ========================================================
     ENABLE / DISABLE AI
  ======================================================== */

  const enableAI = useCallback(() => {

    setAIEnabled(true);

  }, []);

  const disableAI = useCallback(() => {

    setAIEnabled(false);

    clearSuggestions();

  }, [

    clearSuggestions,

  ]);

  /* ========================================================
     REFRESH EVERYTHING
  ======================================================== */

  const refreshAI = useCallback(

    async (

      conversationId,

      messages,

      lead,

      properties,

      availability

    ) => {

      if (!aiEnabled) {

        return generateOfflineSuggestions(lead);

      }

      await Promise.all([

        generateSmartReplies(

          conversationId,

          messages

        ),

        generateConversationSummary(

          conversationId,

          messages

        ),

        generateLeadInsight(

          lead

        ),

        generateNextBestAction(

          lead,

          messages

        ),

        analyzeSentiment(

          messages

        ),

        generateFollowUpSuggestions(

          lead

        ),

        generatePropertyRecommendations(

          lead,

          properties

        ),

        generateViewingSuggestions(

          lead,

          availability

        ),

      ]);

    },

    [

      aiEnabled,

      analyzeSentiment,

      generateConversationSummary,

      generateFollowUpSuggestions,

      generateLeadInsight,

      generateNextBestAction,

      generateOfflineSuggestions,

      generatePropertyRecommendations,

      generateSmartReplies,

      generateViewingSuggestions,

    ]

  );

  /* ========================================================
     PUBLIC API
  ======================================================== */

  return {

    /* Authentication */

    user,

    hasRole,

    hasPermission,

    /* AI Status */

    aiEnabled,

    loading,

    error,

    /* AI Results */

    smartReplies,

    recommendedProperties,

    leadInsight,

    conversationSummary,

    nextBestAction,

    sentiment,

    followUpSuggestions,

    viewingSuggestions,

    /* AI Controls */

    enableAI,

    disableAI,

    clearSuggestions,

    refreshAI,

    refreshSuggestions,

    /* Individual AI Actions */

    generateSmartReplies,

    generateConversationSummary,

    generatePropertyRecommendations,

    generateLeadInsight,

    generateNextBestAction,

    analyzeSentiment,

    generateFollowUpSuggestions,

    generateViewingSuggestions,

    generateOfflineSuggestions,

  };

};

export default useAISuggestions;