/**
 * ==========================================================
 * Read-only monitoring of the latest AI conversations.
 *
 * Viewer users can observe customer activity but cannot
 * reply or interact.
 *
 * Future Backend
 * --------------
 * GET /api/viewer/latest-conversations
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  User,
  MessageCircle,
  MapPin,
  Wallet,
  UserCheck,
} from "lucide-react";

const LatestConversations = () => {
  const [conversations, setConversations] = useState([]);

  /**
   * ========================================================
   * INTENT FORMATTER
   * ========================================================
   *
   * Canonical transaction intents:
   *
   * • rent
   * • buy
   * • property_search
   *
   * These describe the customer's transaction intent.
   *
   * Property type, budget, location, bedrooms, etc.
   * remain separate search criteria.
   */
  const formatIntent = (intent) => {
    switch (
      String(intent || "")
        .trim()
        .toLowerCase()
    ) {
      case "rent":
        return "Rent";

      case "buy":
        return "Buy";

      case "property_search":
        return "Property Search";

      default:
        return "Not Specified";
    }
  };

  //--------------------------------------------------------

  useEffect(() => {
    // Temporary mock data

    setConversations([
      {
        _id: "conv001",
        customer: "John Mwangi",
        intent: "rent",
        budget: "KES 9M",
        location: "Westlands",
        agent: "Sarah Wanjiru",
      },

      {
        _id: "conv002",
        customer: "Grace Wanjiku",
        intent: "buy",
        budget: "KES 18M",
        location: "Karen",
        agent: "James Kariuki",
      },

      {
        _id: "conv003",
        customer: "Brian Otieno",
        intent: "property_search",
        budget: "KES 35M",
        location: "Upper Hill",
        agent: "Peter Maina",
      },

      {
        _id: "conv004",
        customer: "Faith Njeri",
        intent: "buy",
        budget: "KES 6M",
        location: "Ruaka",
        agent: "Sarah Wanjiru",
      },
    ]);
  }, []);

  //--------------------------------------------------------

  return (
    <section
      className="
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-xl
      "
    >
      {/* Header */}

      <div className="border-b border-slate-800 p-6">
        <div className="flex items-center gap-3">
          <MessageCircle
            size={24}
            className="text-cyan-400"
          />

          <div>
            <h2 className="text-2xl font-bold text-white">
              Latest Conversations
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Recent AI qualification conversations.
            </p>
          </div>
        </div>
      </div>

      {/* Conversation List */}

      <div className="divide-y divide-slate-800">
        {conversations.map((conversation) => (
          <div
            key={conversation._id}
            className="p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div
                  className="
                    rounded-xl
                    bg-cyan-500/20
                    p-3
                  "
                >
                  <User
                    size={20}
                    className="text-cyan-400"
                  />
                </div>

                <div>
                  {/* Customer */}

                  <h3 className="text-lg font-semibold text-white">
                    {conversation.customer}
                  </h3>

                  {/* Transaction Intent */}

                  <div className="mt-4 flex items-center gap-2">
                    <MessageCircle
                      size={15}
                      className="text-cyan-400"
                    />

                    <span className="text-sm text-slate-300">
                      {formatIntent(
                        conversation.intent
                      )}
                    </span>
                  </div>

                  {/* Budget */}

                  <div className="mt-2 flex items-center gap-2">
                    <Wallet
                      size={15}
                      className="text-emerald-400"
                    />

                    <span className="text-sm text-slate-300">
                      {conversation.budget}
                    </span>
                  </div>

                  {/* Location */}

                  <div className="mt-2 flex items-center gap-2">
                    <MapPin
                      size={15}
                      className="text-orange-400"
                    />

                    <span className="text-sm text-slate-300">
                      {conversation.location}
                    </span>
                  </div>

                  {/* Assigned Agent */}

                  <div className="mt-2 flex items-center gap-2">
                    <UserCheck
                      size={15}
                      className="text-violet-400"
                    />

                    <span className="text-sm text-slate-300">
                      {conversation.agent}
                    </span>
                  </div>
                </div>
              </div>

              {/* Read Only Badge */}

              <span
                className="
                  rounded-full
                  border
                  border-slate-700
                  bg-slate-800
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-slate-400
                "
              >
                Read Only
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LatestConversations;