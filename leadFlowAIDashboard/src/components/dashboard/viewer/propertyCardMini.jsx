/**
 * ==========================================================
 *
 * Compact customer-facing property card.
 *
 * Used In
 * ----------------------------------------------------------
 * • AI Property Recommendations
 * • Similar Properties
 * • Nearby Properties
 * • Favorites
 * • Recently Viewed
 * • Search Results
 *
 * Customer Can
 * ----------------------------------------------------------
 * ✓ View property summary
 * ✓ Save property
 * ✓ Compare property
 * ✓ Open property details
 *
 * Customer Cannot
 * ----------------------------------------------------------
 * ✗ View CRM information
 * ✗ View owner details
 * ✗ View internal notes
 * ✗ View commission
 *
 * ==========================================================
 */

import {

  BedDouble,

  Bath,

  MapPin,

  ShieldCheck,

  Heart,

} from "lucide-react";

const PropertyCardMini = ({

  property,

  onView,

  onFavorite,

  onCompare,

}) => {

  /* ========================================================
     EMPTY STATE
  ======================================================== */

  if (!property) {

    return (

      <article
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-5
        "
      >

        <div
          className="
            flex
            items-center
            justify-center
            h-40
            rounded-xl
            bg-slate-800
            text-slate-500
          "
        >

          Property unavailable

        </div>

      </article>

    );

  }

  /* ========================================================
     COMPONENT
  ======================================================== */

  return (

    <article
      className="
        overflow-hidden
        rounded-2xl
        border
        border-slate-800
        bg-slate-900
        shadow-lg
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-cyan-500/40
        hover:shadow-cyan-500/10
      "
    >

      {/*======================================================
        IMAGE
      ======================================================*/}

      <div className="relative">

        <img

          src={
            property.image ||
            "/images/property-placeholder.jpg"
          }

          alt={property.title}

          className="
            h-48
            w-full
            object-cover
          "

        />

        {/* Verified Badge */}

        {property.verified && (

          <span
            className="
              absolute
              left-4
              top-4
              flex
              items-center
              gap-2
              rounded-full
              bg-emerald-500
              px-3
              py-1
              text-xs
              font-semibold
              text-white
              shadow-md
            "
          >

            <ShieldCheck className="h-4 w-4" />

            Verified

          </span>

        )}

        {/* Favorite */}

        <button

          onClick={() =>
            onFavorite?.(property)
          }

          className="
            absolute
            right-4
            top-4
            rounded-full
            bg-slate-900/80
            p-2
            backdrop-blur
            transition
            hover:bg-red-500
            hover:text-white
          "

        >

          <Heart

            className={`
              h-5
              w-5
              ${
                property.isFavorite
                  ? "fill-red-500 text-red-500"
                  : "text-white"
              }
            `}

          />

        </button>

      </div>

      {/*======================================================
        PROPERTY SUMMARY
      ======================================================*/}

      <div className="p-5">

        <h3
          className="
            line-clamp-2
            text-lg
            font-bold
            text-white
          "
        >

          {property.title}

        </h3>

        <div
          className="
            mt-3
            flex
            items-center
            gap-2
            text-sm
            text-slate-400
          "
        >

          <MapPin
            className="
              h-4
              w-4
              text-cyan-400
            "
          />

          <span className="line-clamp-1">

            {property.location}

          </span>

        </div>

        {/*======================================================
          PRICE
        ======================================================*/}

        <div
          className="
            mt-5
            flex
            items-center
            justify-between
          "
        >

          <div>

            <p
              className="
                text-xs
                uppercase
                tracking-wide
                text-slate-500
              "
            >

              Price

            </p>

            <h4
              className="
                text-2xl
                font-bold
                text-cyan-400
              "
            >

              {property.price}

            </h4>

          </div>

          {/* Property Type */}

          <span
            className="
              rounded-full
              border
              border-cyan-500/20
              bg-cyan-500/10
              px-3
              py-2
              text-xs
              font-semibold
              text-cyan-300
            "
          >

            {property.type}

          </span>

        </div>

        {/*======================================================
          PROPERTY FEATURES
        ======================================================*/}

        <div
          className="
            mt-6
            grid
            grid-cols-2
            gap-4
          "
        >

          {/* Bedrooms */}

          <div
            className="
              flex
              items-center
              gap-3
              rounded-xl
              border
              border-slate-800
              bg-slate-950/40
              p-3
            "
          >

            <BedDouble
              className="
                h-5
                w-5
                text-cyan-400
              "
            />

            <div>

              <p
                className="
                  text-xs
                  text-slate-500
                "
              >

                Bedrooms

              </p>

              <p
                className="
                  font-semibold
                  text-white
                "
              >

                {property.bedrooms}

              </p>

            </div>

          </div>

          {/* Bathrooms */}

          <div
            className="
              flex
              items-center
              gap-3
              rounded-xl
              border
              border-slate-800
              bg-slate-950/40
              p-3
            "
          >

            <Bath
              className="
                h-5
                w-5
                text-cyan-400
              "
            />

            <div>

              <p
                className="
                  text-xs
                  text-slate-500
                "
              >

                Bathrooms

              </p>

              <p
                className="
                  font-semibold
                  text-white
                "
              >

                {property.bathrooms}

              </p>

            </div>

          </div>

        </div>

        {/*======================================================
          AI MATCH SCORE
        ======================================================*/}

        {property.aiMatchScore !== undefined && (

          <div
            className="
              mt-6
              rounded-2xl
              border
              border-emerald-500/20
              bg-emerald-500/10
              p-4
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
              "
            >

              <div>

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wide
                    text-emerald-300
                  "
                >

                  AI Match

                </p>

                <p
                  className="
                    mt-1
                    text-2xl
                    font-bold
                    text-emerald-400
                  "
                >

                  {property.aiMatchScore}%

                </p>

              </div>

              <div
                className="
                  rounded-full
                  bg-emerald-500
                  px-4
                  py-2
                  text-xs
                  font-bold
                  text-slate-950
                "
              >

                Recommended

              </div>

            </div>

            <div
              className="
                mt-4
                h-2
                overflow-hidden
                rounded-full
                bg-slate-800
              "
            >

              <div
                className="
                  h-full
                  rounded-full
                  bg-emerald-500
                  transition-all
                  duration-500
                "
                style={{
                  width: `${property.aiMatchScore}%`,
                }}
              />

            </div>

          </div>

        )}

        {/*======================================================
          ACTION BUTTONS
        ======================================================*/}

        <div
          className="
            mt-6
            flex
            flex-wrap
            gap-3
          "
        >

          {/* View Details */}

          <button
            onClick={() => onView?.(property)}
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
              duration-300
              hover:bg-cyan-400
            "
          >

            View Details

          </button>

          {/* Compare */}

          <button
            onClick={() => onCompare?.(property)}
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
              duration-300
              hover:border-cyan-500/40
              hover:bg-slate-700
            "
          >

            Compare

          </button>

        </div>

      </div>

      {/*======================================================
        FOOTER
      ======================================================*/}

      <div
        className="
          flex
          items-center
          justify-between
          border-t
          border-slate-800
          bg-slate-950/40
          px-5
          py-4
        "
      >

        <p
          className="
            text-xs
            text-slate-500
          "
        >

          Property ID

          {" "}

          <span
            className="
              font-medium
              text-slate-400
            "
          >

            #{property.id}

          </span>

        </p>

        {property.updatedAt && (

          <p
            className="
              text-xs
              text-slate-500
            "
          >

            Updated{" "}

            {new Date(
              property.updatedAt
            ).toLocaleDateString()}

          </p>

        )}

      </div>

    </article>

  );

};

export default PropertyCardMini;