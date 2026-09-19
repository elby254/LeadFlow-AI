/**
 * ==========================================================
 * Displays recent property searches.
 *
 * Helps agents quickly rerun common searches.
 *
 * Future Backend
 * --------------
 * GET /properties/searches
 *
 * ==========================================================
 */

import { Clock3, Search } from "lucide-react";
import { useEffect, useState } from "react";

const PropertySearches = ({ onSearchSelect }) => {

  const [recentSearches, setRecentSearches] = useState([]);

  //----------------------------------------------------------

  useEffect(() => {

    /**
     * Mock data.
     * Replace with backend request later.
     */

    setRecentSearches([

      {

        id: 1,

        title: "Apartments • Westlands",

        budget: "KES 10M",

      },

      {

        id: 2,

        title: "Houses • Karen",

        budget: "KES 35M",

      },

      {

        id: 3,

        title: "Commercial • Kilimani",

        budget: "KES 50M",

      },

      {

        id: 4,

        title: "Land • Runda",

        budget: "KES 18M",

      },

    ]);

  }, []);

  //----------------------------------------------------------

  return (

    <section
      className="
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        p-6
        shadow-xl
      "
    >

      {/* Header */}

      <div className="mb-6 flex items-center gap-3">

        <Clock3 className="text-cyan-400" />

        <div>

          <h2 className="text-xl font-bold text-white">

            Recent Searches

          </h2>

          <p className="text-sm text-slate-400">

            Quickly rerun previous property searches.

          </p>

        </div>

      </div>

      {/* Searches */}

      <div className="space-y-4">

        {recentSearches.map((search) => (

          <button

            key={search.id}

            onClick={() =>

              onSearchSelect && onSearchSelect(search)

            }

            className="
              flex
              w-full
              items-center
              justify-between
              rounded-2xl
              border
              border-slate-800
              bg-slate-950
              p-4
              text-left
              transition
              hover:border-cyan-500/40
              hover:bg-slate-800
            "

          >

            <div>

              <h3 className="font-semibold text-white">

                {search.title}

              </h3>

              <p className="mt-1 text-sm text-slate-400">

                Budget: {search.budget}

              </p>

            </div>

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-cyan-500/20
              "
            >

              <Search
                size={18}
                className="text-cyan-400"
              />

            </div>

          </button>

        ))}

      </div>

    </section>

  );

};

export default PropertySearches;
