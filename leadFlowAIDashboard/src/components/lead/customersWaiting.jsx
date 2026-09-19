/**
 * ==========================================================
 * Displays customers currently waiting for an
 * agent response or follow-up.
 *
 * Future Backend
 * --------------
 * GET /api/agent/customers-waiting
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  User,
  Clock3,
  PhoneCall,
  MessageCircle,
} from "lucide-react";

const CustomersWaiting = () => {

  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);

  //--------------------------------------------------------

  useEffect(() => {

    // Mock data

    setCustomers([

      {
        id: "lead001",

        customer: "John Mwangi",

        waiting: "42 mins",

        reason: "Requested property viewing",

        priority: "High",

      },

      {
        id: "lead002",

        customer: "Grace Wanjiku",

        waiting: "1 hr 18 mins",

        reason: "Waiting for property photos",

        priority: "Medium",

      },

      {
        id: "lead003",

        customer: "Brian Otieno",

        waiting: "2 hrs",

        reason: "Requested callback",

        priority: "High",

      },

    ]);

  }, []);

  //--------------------------------------------------------

  const badgeColor = (priority) => {

    switch (priority) {

      case "High":
        return "bg-red-500/20 text-red-400";

      case "Medium":
        return "bg-yellow-500/20 text-yellow-400";

      default:
        return "bg-cyan-500/20 text-cyan-400";

    }

  };

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

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-bold text-white">
              Customers Waiting
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Leads waiting for your next action.
            </p>

          </div>

          <span
            className="
              rounded-full
              bg-orange-500
              px-3
              py-1
              text-sm
              font-bold
              text-white
            "
          >
            {customers.length}
          </span>

        </div>

      </div>

      {/* Waiting List */}

      <div className="space-y-4 p-6">

        {customers.map((customer) => (

          <div
            key={customer.id}
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-950
              p-5
            "
          >

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

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

                  <h3 className="font-semibold text-white">
                    {customer.customer}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    {customer.reason}
                  </p>

                </div>

              </div>

              <span
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  ${badgeColor(customer.priority)}
                `}
              >
                {customer.priority}
              </span>

            </div>

            <div
              className="
                mt-5
                flex
                items-center
                justify-between
              "
            >

              <div className="flex items-center gap-2">

                <Clock3
                  size={16}
                  className="text-orange-400"
                />

                <span className="text-sm text-slate-300">
                  Waiting:
                </span>

                <span className="font-semibold text-white">
                  {customer.waiting}
                </span>

              </div>

              <div className="flex gap-3">

                <button
                  onClick={() =>
                    navigate(`/conversation/${customer.id}`)
                  }
                  className="
                    rounded-xl
                    border
                    border-slate-700
                    px-4
                    py-2
                    text-sm
                    text-white
                    hover:bg-slate-800
                  "
                >
                  <MessageCircle
                    size={16}
                    className="inline mr-2"
                  />
                  Chat
                </button>

                <button
                  onClick={() =>
                    navigate(`/contact/${customer.id}`)
                  }
                  className="
                    rounded-xl
                    bg-cyan-500
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-slate-950
                    hover:bg-cyan-400
                  "
                >
                  <PhoneCall
                    size={16}
                    className="inline mr-2"
                  />
                  Call
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

    </section>

  );

};

export default CustomersWaiting;