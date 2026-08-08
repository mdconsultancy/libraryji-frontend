<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SubscriptionPlanSeeder::class,
        ]);

        User::firstOrCreate(
            ['email' => 'superadmin@libraryji.com'],
            [
                'current_tenant_id' => null,
                'role' => 'super_admin',
                'name' => 'LibraryJi Super Admin',
                'password' => bcrypt('password'),
                'status' => 'active',
            ]
        );
    }
}
