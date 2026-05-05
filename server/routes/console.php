<?php

use App\Services\DeliveryRequestService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('foodgo:ping', function (): void {
    $this->comment('FoodGo console is available.');
})->purpose('Check that the console route file loads.');

Artisan::command('foodgo:expire-delivery-requests', function (): int {
    $expired = app(DeliveryRequestService::class)->expireOpenRequests();

    $this->info("Expired {$expired} delivery request(s).");

    return 0;
})->purpose('Expire stale open delivery requests.');

Schedule::command('foodgo:expire-delivery-requests')->everyFiveMinutes();
