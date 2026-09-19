/**
 * ==========================================================
 * Displays one AI property recommendation.
 *
 * Unlike PropertyCard, this focuses on WHY
 * LeadFlow AI recommended the property.
 *
 * Used By
 * -------
 * • Recommendations.jsx
 * • LeadDetails.jsx
 * • PropertyMatches.jsx
 *
 * ==========================================================
 */

import { useNavigate } from "react-router-dom";

import {
  Sparkles,
  MapPin,
  BedDouble,
  Bath,
  ArrowRight,
} from "lucide-react";

import PropertyStatusBadge from "./propertyStatusBadge";

const RecommendationCard = ({ recommendation }) => {

  const navigate = useNavigate();

  //----------------------------------------------------------

  const scoreColor = () => {

    if (recommendation.score >= 90)
      return "text-emerald-400";

    if (recommendation.score >= 75)
      return "text-cyan-400";

    if (recommendation.score >= 60)
      return "text-yellow-400";

    return "text-red-400";

  };

  //----------------------------------------------------------

  return (

    <article
      className="
        overflow-hidden
        rounded-3xl
        border
        border-cyan-500/20
        bg-slate-900
        shadow-xl
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-cyan-400
      "
    >

      {/* Property Image */}

      <img

        src={recommendation.image}

        alt={recommendation.title}

        className="h-60 w-full object-cover"

      />

      <div className="space-y-5 p-6">

        {/* Header */}

        <div className="flex items-start justify-between">

          <div>

            <h2 className="text-xl font-bold text-white">

              {recommendation.title}

            </h2>

            <div className="mt-2 flex items-center gap-2 text-slate-400">

              <MapPin size={16} />

              {recommendation.location}

            </div>

          </div>

          <PropertyStatusBadge

            status={recommendation.status}

          />

        </div>

        {/* AI Match Score */}

        <div
          className="
            rounded-2xl
            bg-slate-950
            p-5
          "
        >

          <div className="flex items-center gap-2">

            <Sparkles
              size={18}
              className="text-cyan-400"
            />

            <p className="font-semibold text-cyan-400">

              AI Match Score

            </p>

          </div>

          <h3
            className={`mt-3 text-4xl font-bold ${scoreColor()}`}
          >

            {recommendation.score}%

          </h3>

        </div>

        {/* AI Explanation */}

        <div
          className="
            rounded-2xl
            bg-cyan-500/10
            p-5
          "
        >

          <p className="text-sm font-semibold text-cyan-400">

            Why LeadFlow AI selected this property

          </p>

          <p className="mt-3 leading-7 text-slate-300">

            {recommendation.reason}

          </p>

        </div>

        {/* Details */}

        <div className="grid grid-cols-3 gap-4">

          <div className="rounded-xl bg-slate-950 p-4 text-center">

            <BedDouble
              size={18}
              className="mx-auto text-cyan-400"
            />

            <p className="mt-2 text-white">

              {recommendation.bedrooms}

            </p>

          </div>

          <div className="rounded-xl bg-slate-950 p-4 text-center">

            <Bath
              size={18}
              className="mx-auto text-cyan-400"
            />

            <p className="mt-2 text-white">

              {recommendation.bathrooms}

            </p>

          </div>

          <div className="rounded-xl bg-slate-950 p-4 text-center">

            <p className="text-xs text-slate-400">

              Price

            </p>

            <p className="mt-2 text-sm font-semibold text-cyan-400">

              KES {Number(recommendation.price).toLocaleString()}

            </p>

          </div>

        </div>

        {/* Actions */}

        <div className="flex gap-3">

          <button

            onClick={() =>

              navigate(`/properties/${recommendation._id}`)

            }

            className="
              flex-1
              rounded-xl
              bg-cyan-500
              py-3
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "

          >

            View Property

          </button>

          <button

            onClick={() =>

              navigate(`/contact/${recommendation.leadId}`)

            }

            className="
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-slate-700
              px-5
              py-3
              text-white
              transition
              hover:bg-slate-800
            "

          >

            Contact Lead

            <ArrowRight size={16} />

          </button>

        </div>

      </div>

    </article>

  );

};

export default RecommendationCard;

