/**
 * ==========================================================
 * Displays customer conversations waiting for an
 * agent response.
 *
 * Future Backend
 * --------------
 * GET /api/agent/unread-messages
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  MessageCircle,
  Clock3,
  User,
} from "lucide-react";

const UnreadMessages = () => {

  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);

  //--------------------------------------------------------

  useEffect(() => {

    // Temporary mock data

    setMessages([

      {
        id: "lead001",

        customer: "John Mwangi",

        message:
          "Can I schedule a viewing tomorrow afternoon?",

        time: "2 mins ago",

        unread: 2,

      },

      {
        id: "lead002",

        customer: "Grace Wanjiku",

        message:
          "Do you have more photos of the maisonette?",

        time: "18 mins ago",

        unread: 1,

      },

      {
        id: "lead003",

        customer: "Brian Otieno",

        message:
          "I'm interested. Can someone call me today?",

        time: "35 mins ago",

        unread: 3,

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

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-bold text-white">
              Unread Messages
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Customers waiting for your response.
            </p>

          </div>

          <span
            className="
              rounded-full
              bg-red-500
              px-3
              py-1
              text-sm
              font-bold
              text-white
            "
          >
            {messages.length}
          </span>

        </div>

      </div>

      {/* Messages */}

      <div className="divide-y divide-slate-800">

        {messages.map((item) => (

          <button
            key={item.id}
            onClick={() =>
              navigate(`/conversation/${item.id}`)
            }
            className="
              flex
              w-full
              items-start
              gap-4
              p-5
              text-left
              transition
              hover:bg-slate-800/40
            "
          >

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

            <div className="flex-1">

              <div className="flex items-center justify-between">

                <h3 className="font-semibold text-white">
                  {item.customer}
                </h3>

                <div className="flex items-center gap-2">

                  <Clock3
                    size={14}
                    className="text-slate-500"
                  />

                  <span className="text-xs text-slate-500">
                    {item.time}
                  </span>

                </div>

              </div>

              <div className="mt-3 flex items-start gap-2">

                <MessageCircle
                  size={16}
                  className="mt-1 text-cyan-400"
                />

                <p className="text-sm text-slate-300">
                  {item.message}
                </p>

              </div>

            </div>

            <div
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-red-500
                text-sm
                font-bold
                text-white
              "
            >
              {item.unread}
            </div>

          </button>

        ))}

      </div>

    </section>

  );

};

export default UnreadMessages;