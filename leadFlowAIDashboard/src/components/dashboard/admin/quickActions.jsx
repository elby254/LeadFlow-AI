/**
 * ==========================================================
 *
 * PURPOSE
 * -------
 * Fast navigation panel for administrators.
 *
 * Gives one-click access to the most common LeadFlowAI
 * management areas.
 *
 * USED BY
 * -------
 * AdminDashboard.jsx
 *
 * QUICK ACTIONS
 * -------------
 * • View All Leads
 * • Manage Agents
 * • Assignment Queue
 * • Follow-ups
 * • Conversations
 * • AI Insights
 * • Reports
 * • Settings
 *
 * ==========================================================
 */

import {
  UserPlus,
  Users,
  Upload,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    title: "Add Agent",
    icon: UserPlus,
    color: "bg-cyan-500",
    description: "Create a new sales agent",
    path: "/admin/create-agent",
  },
  {
    title: "Add Viewer",
    icon: Users,
    color: "bg-emerald-500",
    description: "Create a read-only workspace user",
    path: "/admin/create-viewer",
  },
  {
    title: "Import Leads",
    icon: Upload,
    color: "bg-orange-500",
    description: "Upload leads from CSV or Excel",
    path: "/admin/import-leads",
  },
  {
    title: "View Reports",
    icon: BarChart3,
    color: "bg-violet-500",
    description: "Business analytics & exports",
    path: "/admin/reports",
  },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

       <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          ⚡ Quick Actions
        </h2>

        <p className="mt-2 text-slate-400">
           Frequently used administrative actions.
        </p>
       </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

        {actions.map((action) => {

          const Icon = action.icon;

          return (

            <button
              key={action.title}
              onClick={() => navigate(action.path)}
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
                p-5
                text-left
                transition-all
                duration-300
                hover:-translate-y-1
                hover:border-cyan-500/40
                hover:shadow-lg
                hover:shadow-cyan-900/20
              "
            >

              <div
                className={`
                  ${action.color}
                  mb-4
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                `}
              >
                <Icon
                  size={22}
                  className="text-white"
                />
              </div>

              <h3 className="text-lg font-semibold text-white">
                {action.title}
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                {action.description}
              </p>

            </button>

          );

        })}

      </div>

    </section>
  );
};

export default QuickActions;
