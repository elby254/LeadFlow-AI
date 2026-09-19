/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Reusable pagination component.
 *
 * Used By
 * ----------------------------------------------------------
 * • Admin Properties
 * • Agent Properties
 * • Property Listings
 * • Search Results
 * • Recommendations
 *
 * ==========================================================
 */

import {

  ChevronLeft,

  ChevronRight,

} from "lucide-react";

const PropertyPagination = ({

  currentPage = 1,

  totalPages = 1,

  onPageChange,

}) => {

  /*
  ==========================================================
  CHANGE PAGE
  ==========================================================
  */

  const changePage = (page) => {

    if (

      page < 1 ||

      page > totalPages ||

      page === currentPage

    ) {

      return;

    }

    onPageChange?.(page);

  };

  /*
  ==========================================================
  NO PAGINATION REQUIRED
  ==========================================================
  */

  if (totalPages <= 1) {

    return null;

  }

  return (

    <div className="mt-8 flex items-center justify-between">

      {/* Previous */}

      <button

        type="button"

        onClick={() =>

          changePage(currentPage - 1)

        }

        disabled={currentPage === 1}

        className="
          inline-flex
          items-center
          gap-2
          rounded-lg
          border
          px-4
          py-2
          transition
          hover:bg-muted
          disabled:cursor-not-allowed
          disabled:opacity-50
        "

      >

        <ChevronLeft size={18} />

        Previous

      </button>

      {/* Pages */}

      <div className="flex items-center gap-2">

        {Array.from(

          { length: totalPages },

          (_, index) => index + 1

        ).map((page) => (

          <button

            key={page}

            type="button"

            onClick={() =>

              changePage(page)

            }

            className={`

              h-10
              w-10
              rounded-lg
              border
              transition

              ${

                currentPage === page

                  ? "border-primary bg-primary text-primary-foreground"

                  : "hover:bg-muted"

              }

            `}

          >

            {page}

          </button>

        ))}

      </div>

      {/* Next */}

      <button

        type="button"

        onClick={() =>

          changePage(currentPage + 1)

        }

        disabled={

          currentPage === totalPages

        }

        className="
          inline-flex
          items-center
          gap-2
          rounded-lg
          border
          px-4
          py-2
          transition
          hover:bg-muted
          disabled:cursor-not-allowed
          disabled:opacity-50
        "

      >

        Next

        <ChevronRight size={18} />

      </button>

    </div>

  );

};

export default PropertyPagination;