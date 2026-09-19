/**
 * ==========================================================
 * LeadFlow AI
 * Quick Reply Templates
 * ==========================================================
 *
 * Frequently used message templates for agents.
 *
 * Used In
 * ----------------------------------------------------------
 * • Conversation Center
 * • Chat Window
 * • AI Assistant
 * • Lead Details
 *
 * Backend
 * ----------------------------------------------------------
 * GET    /api/templates
 * POST   /api/templates
 * PATCH  /api/templates/:id
 * DELETE /api/templates/:id
 *
 * ==========================================================
 */

import {

  Search,

  Filter,

  RotateCw,

  Loader2,

  AlertTriangle,

  MessageSquare,

} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import templateService from "../../../services/templateService";

const TEMPLATE_CATEGORIES = [

  "All",

  "Greetings",

  "Property Viewing",

  "Follow-up",

  "Price Negotiation",

  "Mortgage",

  "Closing",

  "Custom",

];

const QuickReplyTemplates = ({

  onUseTemplate,

  onEditTemplate,

  onDeleteTemplate,

}) => {

  /*=========================================================
      STATE
  =========================================================*/

  const [templates, setTemplates] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("All");

  /*=========================================================
      LOAD TEMPLATES
  =========================================================*/

  const loadTemplates = async () => {

    try {

      setLoading(true);

      setError("");

      const data = await templateService.getTemplates();

      setTemplates(

        Array.isArray(data) ? data : []

      );

    } catch (err) {

      console.error(err);

      setError(

        "Unable to load quick reply templates."

      );

      setTemplates([]);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadTemplates();

  }, []);

  /*=========================================================
      FILTERED DATA
  =========================================================*/

  const filteredTemplates = useMemo(() => {

    return templates.filter((template) => {

      const matchesSearch =

        template.title
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||

        template.message
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =

        category === "All"

          ? true

          : template.category === category;

      return matchesSearch && matchesCategory;

    });

  }, [

    templates,

    search,

    category,

  ]);

  /*=========================================================
      EMPTY STATE
  =========================================================*/

  if (!loading && !templates.length && !error) {

    return (

      <aside
        className="
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-8
          shadow-xl
        "
      >

        <div className="text-center">

          <MessageSquare
            className="
              mx-auto
              h-16
              w-16
              text-slate-600
            "
          />

          <h2
            className="
              mt-5
              text-xl
              font-bold
              text-white
            "
          >

            No Templates Available

          </h2>

          <p
            className="
              mt-3
              text-sm
              leading-7
              text-slate-400
            "
          >

            Create reusable reply templates
            to speed up conversations with
            customers.

          </p>

        </div>

      </aside>

    );

  }

  /*=========================================================
      COMPONENT
  =========================================================*/

  return (

    <aside
      className="
        overflow-hidden
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-xl
      "
    >

      {/*=====================================================
          HEADER
      =====================================================*/}

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-slate-800
          bg-gradient-to-r
          from-cyan-600/10
          to-blue-600/10
          p-6
        "
      >

        <div
          className="
            flex
            items-center
            gap-4
          "
        >

          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-cyan-500/10
            "
          >

            <MessageSquare
              className="
                h-6
                w-6
                text-cyan-400
              "
            />

          </div>

          <div>

            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >

              Quick Reply Templates

            </h2>

            <p
              className="
                text-sm
                text-slate-400
              "
            >

              Reusable customer responses

            </p>

          </div>

        </div>

        <button
          onClick={loadTemplates}
          disabled={loading}
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-800
            p-3
            transition
            hover:border-cyan-500/40
            hover:bg-slate-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          {loading ? (

            <Loader2
              className="
                h-5
                w-5
                animate-spin
                text-cyan-400
              "
            />

          ) : (

            <RotateCw
              className="
                h-5
                w-5
                text-cyan-400
              "
            />

          )}

        </button>

      </div>

      {/*=====================================================
          ERROR
      =====================================================*/}

      {error && (

        <div
          className="
            m-6
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-red-500/20
            bg-red-500/10
            p-4
          "
        >

          <AlertTriangle
            className="
              mt-0.5
              h-5
              w-5
              text-red-400
            "
          />

          <div>

            <p
              className="
                text-sm
                text-red-300
              "
            >

              {error}

            </p>

            <button
              onClick={loadTemplates}
              className="
                mt-3
                rounded-lg
                bg-red-500
                px-4
                py-2
                text-xs
                font-semibold
                text-white
                transition
                hover:bg-red-400
              "
            >

              Retry

            </button>

          </div>

        </div>

      )}

      {/*=====================================================
          SEARCH + FILTER
      =====================================================*/}

      {!error && (

        <div
          className="
            border-b
            border-slate-800
            p-6
          "
        >

          <div
            className="
              flex
              flex-col
              gap-4
              lg:flex-row
            "
          >

            {/*==============================================
                SEARCH
            ==============================================*/}

            <div
              className="
                relative
                flex-1
              "
            >

              <Search
                className="
                  absolute
                  left-4
                  top-1/2
                  h-5
                  w-5
                  -translate-y-1/2
                  text-slate-500
                "
              />

              <input

                type="text"

                placeholder="Search templates..."

                value={search}

                onChange={(e) =>
                  setSearch(e.target.value)
                }

                className="
                  w-full
                  rounded-2xl
                  border
                  border-slate-700
                  bg-slate-950
                  py-3
                  pl-12
                  pr-4
                  text-sm
                  text-white
                  outline-none
                  transition
                  placeholder:text-slate-500
                  focus:border-cyan-500
                "

              />

            </div>

            {/*==============================================
                CATEGORY FILTER
            ==============================================*/}

            <div
              className="
                relative
                w-full
                lg:w-72
              "
            >

              <Filter
                className="
                  absolute
                  left-4
                  top-1/2
                  h-5
                  w-5
                  -translate-y-1/2
                  text-slate-500
                "
              />

              <select

                value={category}

                onChange={(e) =>
                  setCategory(e.target.value)
                }

                className="
                  w-full
                  appearance-none
                  rounded-2xl
                  border
                  border-slate-700
                  bg-slate-950
                  py-3
                  pl-12
                  pr-4
                  text-sm
                  text-white
                  outline-none
                  transition
                  focus:border-cyan-500
                "

              >

                {TEMPLATE_CATEGORIES.map((item) => (

                  <option
                    key={item}
                    value={item}
                  >

                    {item}

                  </option>

                ))}

              </select>

            </div>

          </div>

        </div>

      )}

      {/*=====================================================
          LOADING SKELETON
      =====================================================*/}

      {loading && (

        <div
          className="
            grid
            gap-6
            p-6
          "
        >

          {[1, 2, 3, 4].map((item) => (

            <div
              key={item}
              className="
                h-52
                animate-pulse
                rounded-3xl
                bg-slate-800
              "
            />

          ))}

        </div>

      )}

      {/*=====================================================
          NO SEARCH RESULTS
      =====================================================*/}

      {!loading &&
        !error &&
        filteredTemplates.length === 0 && (

        <div className="p-8">

          <div
            className="
              rounded-3xl
              border
              border-slate-800
              bg-slate-950/40
              p-10
              text-center
            "
          >

            <Search
              className="
                mx-auto
                h-12
                w-12
                text-slate-600
              "
            />

            <h3
              className="
                mt-5
                text-lg
                font-semibold
                text-white
              "
            >

              No Matching Templates

            </h3>

            <p
              className="
                mt-3
                text-sm
                leading-7
                text-slate-400
              "
            >

              Try another keyword or
              choose a different category.

            </p>

          </div>

        </div>

      )}

      {/*=====================================================
          TEMPLATE GRID
      =====================================================*/}

      {!loading &&
        !error &&
        filteredTemplates.length > 0 && (

        <div
          className="
            grid
            gap-6
            p-6
          "
        >

          {filteredTemplates.map((template) => (

            <div
              key={template.id}
              className="
                overflow-hidden
                rounded-3xl
                border
                border-slate-800
                bg-slate-950/40
                transition-all
                duration-300
                hover:-translate-y-1
                hover:border-cyan-500/30
                hover:shadow-xl
                hover:shadow-cyan-500/10
              "
            >

              {/*============================================
                  TEMPLATE HEADER
              ============================================*/}

              <div
                className="
                  border-b
                  border-slate-800
                  p-6
                "
              >

                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  "
                >

                  <div>

                    <h3
                      className="
                        text-lg
                        font-bold
                        text-white
                      "
                    >

                      {template.title}

                    </h3>

                    <div
                      className="
                        mt-3
                        flex
                        flex-wrap
                        items-center
                        gap-3
                      "
                    >

                      <span
                        className="
                          rounded-full
                          bg-cyan-500/10
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          text-cyan-300
                        "
                      >

                        {template.category}

                      </span>

                      {template.favorite && (

                        <span
                          className="
                            rounded-full
                            bg-amber-500/10
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            text-amber-300
                          "
                        >

                          ★ Favorite

                        </span>

                      )}

                    </div>

                  </div>

                  <div
                    className="
                      text-right
                    "
                  >

                    <p
                      className="
                        text-xs
                        uppercase
                        tracking-wide
                        text-slate-500
                      "
                    >

                      Uses

                    </p>

                    <h4
                      className="
                        mt-2
                        text-2xl
                        font-bold
                        text-cyan-400
                      "
                    >

                      {template.usageCount || 0}

                    </h4>

                  </div>

                </div>

              </div>

              {/*============================================
                  MESSAGE PREVIEW
              ============================================*/}

              <div className="p-6">

                <div
                  className="
                    rounded-2xl
                    border
                    border-slate-800
                    bg-slate-900
                    p-5
                  "
                >

                  <p
                    className="
                      text-sm
                      leading-7
                      text-slate-300
                      line-clamp-5
                      whitespace-pre-wrap
                    "
                  >

                    {template.message}

                  </p>

                </div>

                {/*==========================================
                    TEMPLATE METADATA
                ==========================================*/}

                <div
                  className="
                    mt-5
                    flex
                    flex-wrap
                    items-center
                    justify-between
                    gap-4
                    text-xs
                    text-slate-500
                  "
                >

                  <span>

                    Updated{" "}

                    {template.updatedAt ||
                      "Recently"}

                  </span>

                  <span>

                    Created by{" "}

                    {template.createdBy ||
                      "System"}

                  </span>

                </div>

                {/*==========================================
                    ACTION BUTTONS
                ==========================================*/}

                <div
                  className="
                    mt-6
                    flex
                    flex-wrap
                    gap-3
                  "
                >

                  {/* Use */}

                  <button
                    onClick={() =>
                      onUseTemplate?.(template)
                    }
                    className="
                      flex-1
                      rounded-xl
                      bg-cyan-500
                      px-5
                      py-3
                      text-sm
                      font-semibold
                      text-slate-950
                      transition
                      hover:bg-cyan-400
                    "
                  >

                    Use Template

                  </button>

                  {/* Copy */}

                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        template.message
                      )
                    }
                    className="
                      rounded-xl
                      border
                      border-slate-700
                      bg-slate-800
                      px-5
                      py-3
                      text-sm
                      font-semibold
                      text-white
                      transition
                      hover:bg-slate-700
                    "
                  >

                    Copy

                  </button>

                  {/* Edit */}

                  <button
                    onClick={() =>
                      onEditTemplate?.(template)
                    }
                    className="
                      rounded-xl
                      border
                      border-amber-500/30
                      bg-amber-500/10
                      px-5
                      py-3
                      text-sm
                      font-semibold
                      text-amber-300
                      transition
                      hover:bg-amber-500
                      hover:text-slate-950
                    "
                  >

                    Edit

                  </button>

                  {/* Delete */}

                  <button
                    onClick={() =>
                      onDeleteTemplate?.(template)
                    }
                    className="
                      rounded-xl
                      border
                      border-red-500/30
                      bg-red-500/10
                      px-5
                      py-3
                      text-sm
                      font-semibold
                      text-red-300
                      transition
                      hover:bg-red-500
                      hover:text-white
                    "
                  >

                    Delete

                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      )}


      {/*=====================================================
          FOOTER
      =====================================================*/}

      {!loading && !error && (

        <div
          className="
            border-t
            border-slate-800
            bg-slate-950/40
            p-6
          "
        >

          <div
            className="
              flex
              flex-col
              gap-3
              text-sm
              text-slate-500
              md:flex-row
              md:items-center
              md:justify-between
            "
          >

            <div>

              Showing{" "}

              <span
                className="
                  font-semibold
                  text-cyan-400
                "
              >

                {filteredTemplates.length}

              </span>

              {" "}template

              {filteredTemplates.length !== 1 && "s"}

            </div>

            <div
              className="
                flex
                items-center
                gap-5
              "
            >

              <span>

                Total Library:

                {" "}

                <span
                  className="
                    font-semibold
                    text-white
                  "
                >

                  {templates.length}

                </span>

              </span>

              <button
                onClick={loadTemplates}
                className="
                  rounded-xl
                  border
                  border-cyan-500/30
                  bg-cyan-500/10
                  px-4
                  py-2
                  text-xs
                  font-semibold
                  text-cyan-300
                  transition
                  hover:bg-cyan-500
                  hover:text-slate-950
                "
              >

                Refresh Library

              </button>

            </div>

          </div>

        </div>

      )}

    </aside>

  );

};

export default QuickReplyTemplates;