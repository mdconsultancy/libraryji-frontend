<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'For a single reading library just getting started.',
                'price' => 999,
                'billing_cycle' => 'monthly',
                'max_seats' => null,
                'max_members' => null,
                'max_staff' => null,
                'features' => ['Unlimited seats', 'Unlimited members & staff', 'Attendance tracking', 'Payment tracking', 'Email support'],
                'sort_order' => 1,
            ],
            [
                'name' => 'Growth',
                'slug' => 'growth',
                'description' => 'For growing libraries with more halls, seats, and staff.',
                'price' => 2499,
                'billing_cycle' => 'monthly',
                'max_seats' => null,
                'max_members' => null,
                'max_staff' => null,
                'features' => ['Everything in Starter', 'Multi-hall management', 'Advanced analytics', 'Priority support'],
                'sort_order' => 2,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'For large libraries with custom needs.',
                'price' => 5999,
                'billing_cycle' => 'monthly',
                'max_seats' => null,
                'max_members' => null,
                'max_staff' => null,
                'features' => ['Everything in Growth', 'Custom branding', 'API access', 'Dedicated account manager'],
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
