<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('restaurants') && ! Schema::hasColumn('restaurants', 'city')) {
            Schema::table('restaurants', function (Blueprint $table): void {
                $table->string('city')->nullable()->after('area');
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table): void {
                if (! Schema::hasColumn('orders', 'customer_id')) {
                    $table->foreignId('customer_id')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
                }
                if (! Schema::hasColumn('orders', 'delivery_partner_id')) {
                    $table->foreignId('delivery_partner_id')->nullable()->after('restaurant_id')->constrained('delivery_partners')->nullOnDelete();
                }
                if (! Schema::hasColumn('orders', 'coupon_id')) {
                    $table->foreignId('coupon_id')->nullable()->after('address_id')->constrained('coupons')->nullOnDelete();
                }
                if (! Schema::hasColumn('orders', 'gst_amount')) {
                    $table->decimal('gst_amount', 10, 2)->default(0)->after('discount_amount');
                }
                if (! Schema::hasColumn('orders', 'delivery_charge')) {
                    $table->decimal('delivery_charge', 10, 2)->default(0)->after('gst_amount');
                }
                if (! Schema::hasColumn('orders', 'platform_fee')) {
                    $table->decimal('platform_fee', 10, 2)->default(0)->after('delivery_charge');
                }
                if (! Schema::hasColumn('orders', 'estimated_delivery_time')) {
                    $table->integer('estimated_delivery_time')->nullable()->after('platform_fee');
                }
                if (! Schema::hasColumn('orders', 'cancellation_reason')) {
                    $table->text('cancellation_reason')->nullable()->after('cancelled_at');
                }
                if (! Schema::hasColumn('orders', 'status_timeline')) {
                    $table->json('status_timeline')->nullable()->after('cancellation_reason');
                }
                if (! Schema::hasColumn('orders', 'order_status')) {
                    $table->string('order_status')->default('placed')->after('status');
                }
            });

            if (Schema::hasColumn('orders', 'customer_id')) {
                DB::table('orders')->whereNull('customer_id')->update(['customer_id' => DB::raw('user_id')]);
            }
            if (Schema::hasColumn('orders', 'order_status')) {
                DB::table('orders')->whereNull('order_status')->update(['order_status' => DB::raw('status')]);
            }
        }

        if (Schema::hasTable('payments') && ! Schema::hasColumn('payments', 'status')) {
            Schema::table('payments', function (Blueprint $table): void {
                $table->string('status')->nullable()->after('payment_status');
            });
            DB::table('payments')->whereNull('status')->update(['status' => DB::raw('payment_status')]);
        }

        if (Schema::hasTable('delivery_assignments')) {
            Schema::table('delivery_assignments', function (Blueprint $table): void {
                if (! Schema::hasColumn('delivery_assignments', 'assigned_at')) {
                    $table->timestamp('assigned_at')->nullable()->after('status');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('delivery_assignments') && Schema::hasColumn('delivery_assignments', 'assigned_at')) {
            Schema::table('delivery_assignments', function (Blueprint $table): void {
                $table->dropColumn('assigned_at');
            });
        }

        if (Schema::hasTable('payments') && Schema::hasColumn('payments', 'status')) {
            Schema::table('payments', function (Blueprint $table): void {
                $table->dropColumn('status');
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table): void {
                if (Schema::hasColumn('orders', 'status_timeline')) {
                    $table->dropColumn('status_timeline');
                }
                if (Schema::hasColumn('orders', 'cancellation_reason')) {
                    $table->dropColumn('cancellation_reason');
                }
                if (Schema::hasColumn('orders', 'estimated_delivery_time')) {
                    $table->dropColumn('estimated_delivery_time');
                }
                if (Schema::hasColumn('orders', 'platform_fee')) {
                    $table->dropColumn('platform_fee');
                }
                if (Schema::hasColumn('orders', 'delivery_charge')) {
                    $table->dropColumn('delivery_charge');
                }
                if (Schema::hasColumn('orders', 'gst_amount')) {
                    $table->dropColumn('gst_amount');
                }
                if (Schema::hasColumn('orders', 'coupon_id')) {
                    $table->dropConstrainedForeignId('coupon_id');
                }
                if (Schema::hasColumn('orders', 'delivery_partner_id')) {
                    $table->dropConstrainedForeignId('delivery_partner_id');
                }
                if (Schema::hasColumn('orders', 'customer_id')) {
                    $table->dropConstrainedForeignId('customer_id');
                }
                if (Schema::hasColumn('orders', 'order_status')) {
                    $table->dropColumn('order_status');
                }
            });
        }

        if (Schema::hasTable('restaurants') && Schema::hasColumn('restaurants', 'city')) {
            Schema::table('restaurants', function (Blueprint $table): void {
                $table->dropColumn('city');
            });
        }
    }
};
