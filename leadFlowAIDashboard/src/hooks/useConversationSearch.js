/**
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 * Handles searching conversations independently from
 * the main conversation loading hook.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Live search
 * ✓ Debounced search
 * ✓ Customer search
 * ✓ Phone search
 * ✓ Email search
 * ✓ Property search
 * ✓ Location search
 * ✓ Status filtering
 * ✓ AI qualification filtering
 * ✓ Assigned agent filtering
 * ✓ Unread conversations
 * ✓ Conversations with attachments
 * ✓ Conversation content search
 * ✓ Search suggestions
 * ✓ Recent searches
 * ✓ Server-side pagination
 * ✓ Highlight matched results
 *
 * Used By
 * ----------------------------------------------------------
 * Agent Conversation Center
 * Viewer Conversation Center
 * Admin Conversation Center
 * Dashboard Search Widgets
 *
 * Backend
 * ----------------------------------------------------------
 * GET  /api/conversations/search
 * GET  /api/conversations/search/suggestions
 * GET  /api/conversations/search/recent
 *
 * ==========================================================
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import useAuth from "./useAuth";

import conversationService from "../services/conversation/conversationService";

/* ==========================================================
   DEFAULT FILTERS
========================================================== */

const DEFAULT_FILTERS = {

  status: "all",

  qualification: "all",

  assignedAgent: "",

  property: "",

  location: "",

  unreadOnly: false,

  hasAttachments: false,

};

/* ==========================================================
   SEARCH CONFIGURATION
========================================================== */

const SEARCH_DELAY = 400;

const PAGE_SIZE = 20;

/* ==========================================================
   HOOK
========================================================== */

const useConversationSearch = () => {

  /* ========================================================
     AUTHENTICATION
  ======================================================== */

  const {

    user,

    hasRole,

  } = useAuth();

  /* ========================================================
     SEARCH INPUT
  ======================================================== */

  const [

    query,

    setQuery,

  ] = useState("");

  const [

    debouncedQuery,

    setDebouncedQuery,

  ] = useState("");

  /* ========================================================
     FILTERS
  ======================================================== */

  const [

    filters,

    setFilters,

  ] = useState(DEFAULT_FILTERS);

  /* ========================================================
     SEARCH RESULTS
  ======================================================== */

  const [

    results,

    setResults,

  ] = useState([]);

  const [

    total,

    setTotal,

  ] = useState(0);

  /* ========================================================
     PAGINATION
  ======================================================== */

  const [

    page,

    setPage,

  ] = useState(1);

  const [

    hasMore,

    setHasMore,

  ] = useState(true);

  /* ========================================================
     SEARCH SUGGESTIONS
  ======================================================== */

  const [

    suggestions,

    setSuggestions,

  ] = useState([]);

  /* ========================================================
     RECENT SEARCHES
  ======================================================== */

  const [

    recentSearches,

    setRecentSearches,

  ] = useState([]);

  /* ========================================================
     SEARCH STATE
  ======================================================== */

  const [

    searching,

    setSearching,

  ] = useState(false);

  const [

    loadingSuggestions,

    setLoadingSuggestions,

  ] = useState(false);

  const [

    error,

    setError,

  ] = useState("");

  /* ========================================================
     DEBOUNCE SEARCH INPUT
  ======================================================== */

  useEffect(() => {

    const timer = setTimeout(() => {

      setDebouncedQuery(query.trim());

    }, SEARCH_DELAY);

    return () => clearTimeout(timer);

  }, [

    query,

  ]);

  /* ========================================================
     LOAD SEARCH SUGGESTIONS
  ======================================================== */

  const loadSuggestions = useCallback(

    async (searchText = debouncedQuery) => {

      if (!searchText) {

        setSuggestions([]);

        return;

      }

      try {

        setLoadingSuggestions(true);

        const response =
          await conversationService.getSearchSuggestions(
            searchText
          );

        const rows =
          response?.suggestions ||
          response?.data ||
          [];

        setSuggestions(

          Array.isArray(rows)

            ? rows

            : []

        );

      }

      catch (error) {

        console.error(

          "Suggestion loading failed",

          error

        );

        setSuggestions([]);

      }

      finally {

        setLoadingSuggestions(false);

      }

    },

    [

      debouncedQuery,

    ]

  );

  /* ========================================================
     LOAD RECENT SEARCHES
  ======================================================== */

  const loadRecentSearches = useCallback(

    async () => {

      try {

        const response =
          await conversationService.getRecentSearches();

        const rows =
          response?.recent ||
          response?.data ||
          [];

        setRecentSearches(

          Array.isArray(rows)

            ? rows

            : []

        );

      }

      catch (error) {

        console.error(

          "Recent searches failed",

          error

        );

      }

    },

    []

  );

  /* ========================================================
     SEARCH CONVERSATIONS
  ======================================================== */

  const searchConversations = useCallback(

    async (

      searchText = debouncedQuery,

      pageNumber = 1

    ) => {

      try {

        setSearching(true);

        setError("");

        const response =
          await conversationService.searchConversations({

            query: searchText,

            page: pageNumber,

            limit: PAGE_SIZE,

            filters,

          });

        const conversations =
          response?.conversations ||
          response?.data ||
          [];

        const totalCount =
          response?.total ||
          conversations.length;

        if (pageNumber === 1) {

          setResults(

            Array.isArray(conversations)

              ? conversations

              : []

          );

        }

        else {

          setResults(previous => [

            ...previous,

            ...conversations,

          ]);

        }

        setTotal(totalCount);

        setHasMore(

          conversations.length === PAGE_SIZE

        );

        setPage(pageNumber);

      }

      catch (error) {

        console.error(

          "Conversation search failed",

          error

        );

        setError(

          error?.message ||

          "Unable to search conversations."

        );

      }

      finally {

        setSearching(false);

      }

    },

    [

      debouncedQuery,

      filters,

    ]

  );

  /* ========================================================
     LOAD NEXT PAGE
  ======================================================== */

  const loadMoreResults = useCallback(

    async () => {

      if (!hasMore) return;

      await searchConversations(

        debouncedQuery,

        page + 1

      );

    },

    [

      hasMore,

      page,

      debouncedQuery,

      searchConversations,

    ]

  );

  /* ========================================================
     AUTO SEARCH
  ======================================================== */

  useEffect(() => {

    if (!debouncedQuery.trim()) {

      setResults([]);

      setTotal(0);

      setHasMore(true);

      setPage(1);

      return;

    }

    searchConversations(

      debouncedQuery,

      1

    );

    loadSuggestions(

      debouncedQuery

    );

  }, [

    debouncedQuery,

    filters,

    searchConversations,

    loadSuggestions,

  ]);

  /* ========================================================
     LOAD RECENT SEARCHES
  ======================================================== */

  useEffect(() => {

    loadRecentSearches();

  }, [

    loadRecentSearches,

  ]);

  /* ========================================================
     UPDATE FILTERS
  ======================================================== */

  const updateFilters = useCallback(

    (newFilters) => {

      setFilters(previous => ({

        ...previous,

        ...newFilters,

      }));

      setPage(1);

    },

    []

  );

  /* ========================================================
     SAVE SEARCH
     (Recent Searches)
  ======================================================== */

  const saveSearch = useCallback(

    async (searchText) => {

      if (!searchText?.trim()) return;

      try {

        await conversationService.saveRecentSearch(

          searchText

        );

        loadRecentSearches();

      }

      catch (error) {

        console.error(

          "Unable to save recent search",

          error

        );

      }

    },

    [

      loadRecentSearches,

    ]

  );

  /* ========================================================
     CLEAR SEARCH
  ======================================================== */

  const clearSearch = useCallback(

    () => {

      setQuery("");

      setResults([]);

      setSuggestions([]);

      setTotal(0);

      setPage(1);

      setHasMore(true);

      setFilters(

        DEFAULT_FILTERS

      );

      setError("");

    },

    []

  );

  /* ========================================================
     RESET FILTERS ONLY
  ======================================================== */

  const resetFilters = useCallback(

    () => {

      setFilters(

        DEFAULT_FILTERS

      );

      setPage(1);

    },

    []

  );

  /* ========================================================
     REFRESH CURRENT SEARCH
  ======================================================== */

  const refreshSearch = useCallback(

    () => {

      searchConversations(

        debouncedQuery,

        1

      );

    },

    [

      debouncedQuery,

      searchConversations,

    ]

  );

  /* ========================================================
     SEARCH RESULT HIGHLIGHTING
  ======================================================== */

  const highlightedResults = useMemo(() => {

    if (!debouncedQuery)

      return results;

    return results.map(result => ({

      ...result,

      highlight: debouncedQuery,

    }));

  }, [

    results,

    debouncedQuery,

  ]);

  /* ========================================================
     SEARCH HELPERS
  ======================================================== */

  const searchCustomer = useCallback(

    (customerName) => {

      setQuery(customerName);

    },

    []

  );

  const searchPhone = useCallback(

    (phoneNumber) => {

      setQuery(phoneNumber);

    },

    []

  );

  const searchEmail = useCallback(

    (email) => {

      setQuery(email);

    },

    []

  );

  const searchProperty = useCallback(

    (propertyId) => {

      updateFilters({

        property: propertyId,

      });

    },

    [

      updateFilters,

    ]

  );

  const searchLocation = useCallback(

    (location) => {

      updateFilters({

        location,

      });

    },

    [

      updateFilters,

    ]

  );

  const searchAssignedAgent = useCallback(

    (agentId) => {

      updateFilters({

        assignedAgent: agentId,

      });

    },

    [

      updateFilters,

    ]

  );

  const searchStatus = useCallback(

    (status) => {

      updateFilters({

        status,

      });

    },

    [

      updateFilters,

    ]

  );

  const searchUnread = useCallback(

    () => {

      updateFilters({

        unreadOnly: true,

      });

    },

    [

      updateFilters,

    ]

  );

  const searchWithAttachments = useCallback(

    () => {

      updateFilters({

        hasAttachments: true,

      });

    },

    [

      updateFilters,

    ]

  );

  const searchHotLeads = useCallback(

    () => {

      updateFilters({

        qualification: "hot",

      });

    },

    [

      updateFilters,

    ]

  );

  const searchAIQualified = useCallback(

    () => {

      updateFilters({

        qualification: "qualified",

      });

    },

    [

      updateFilters,

    ]

  );

  /* ========================================================
     PUBLIC API
  ======================================================== */

  return {

    /* Authentication */

    user,

    hasRole,

    /* Search */

    query,

    setQuery,

    searching,

    error,

    /* Results */

    results,

    highlightedResults,

    total,

    hasMore,

    page,

    /* Suggestions */

    suggestions,

    loadingSuggestions,

    recentSearches,

    /* Filters */

    filters,

    updateFilters,

    resetFilters,

    /* Core Actions */

    searchConversations,

    loadMoreResults,

    refreshSearch,

    saveSearch,

    clearSearch,

    /* Search Helpers */

    searchCustomer,

    searchPhone,

    searchEmail,

    searchProperty,

    searchLocation,

    searchAssignedAgent,

    searchStatus,

    searchUnread,

    searchWithAttachments,

    searchHotLeads,

    searchAIQualified,

  };

};

export default useConversationSearch;