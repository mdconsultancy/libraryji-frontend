"use client";
import React from "react";
import Link from "next/link";
import type { MemberSubscription } from "@/types";

const DailyActivity = ({ subscriptions }: { subscriptions: MemberSubscription[] }) => {
  const daysLeft = (endDate: string) => {
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff <= 0 ? 'Today' : `${diff} day${diff === 1 ? '' : 's'} left`;
  };

  return (
    <>
      <div className="rounded-xl h-full shadow-xs bg-white dark:bg-darkgray p-6 relative w-full words-break">
        <h5 className="card-title mb-10">Expiring Memberships</h5>

        <div className="flex flex-col mt-2">
          {subscriptions.length === 0 ? (
            <p className="text-sm text-gray-500">No memberships expiring in the next 7 days</p>
          ) : (
            <ul>
              {subscriptions.map((sub, index) => (
                <li key={sub.id}>
                  <div className="flex gap-4 min-h-16">
                    <div className="">
                      <p>{daysLeft(sub.end_date)}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-warning p-1.5 w-fit"></div>
                      {index < subscriptions.length - 1 && (
                        <div className="h-full w-px bg-border"></div>
                      )}
                    </div>
                    <div className="">
                      <p className="text-dark dark:text-white text-start">
                        {sub.member?.name ?? 'Member'}&apos;s {sub.plan_name_snapshot} expires {new Date(sub.end_date).toLocaleDateString()}
                      </p>
                      <Link href="/subscriptions" className="text-blue-700">
                        View subscription
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default DailyActivity;
