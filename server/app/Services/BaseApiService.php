<?php

namespace App\Services;

use App\Support\ApiResponse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

abstract class BaseApiService
{
    protected function user()
    {
        return auth()->user();
    }

    protected function userId(): ?int
    {
        return auth()->id();
    }

    protected function table(string $name): Builder
    {
        return DB::table($name);
    }

    protected function paginate(Builder $query, Request $request, int $defaultPerPage = 15): LengthAwarePaginator
    {
        $perPage = max(1, min((int) $request->integer('per_page', $defaultPerPage), 100));

        return $query->paginate($perPage)->withQueryString();
    }

    protected function findOrFail(string $table, int $id): object
    {
        $record = DB::table($table)->where('id', $id)->first();

        abort_if(! $record, 404, 'Record not found.');

        return $record;
    }

    protected function uniqueSlug(string $table, string $column, string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value);
        $slug = $base;
        $counter = 2;

        while (DB::table($table)
            ->where($column, $slug)
            ->when($ignoreId, fn (Builder $query) => $query->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    protected function storeFile(?UploadedFile $file, string $directory): ?string
    {
        if (! $file) {
            return null;
        }

        return $file->store($directory, 'uploads');
    }

    protected function storeBase64File(?string $base64String, string $directory): ?string
    {
        if (! $base64String || ! str_contains($base64String, ';base64,')) {
            return null;
        }

        @[$type, $data] = explode(';base64,', $base64String);
        $data = base64_decode($data);
        $extension = Str::after($type, 'image/');
        $filename = $directory . '/' . Str::random(40) . '.' . $extension;

        Storage::disk('uploads')->put($filename, $data);

        return $filename;
    }

    protected function replaceFile(?UploadedFile $file, ?string $currentPath, string $directory): ?string
    {
        if ($file && $currentPath) {
            Storage::disk('uploads')->delete($currentPath);
        }

        return $this->storeFile($file, $directory);
    }

    protected function replaceBase64File(?string $base64String, ?string $currentPath, string $directory): ?string
    {
        if ($base64String && $currentPath) {
            Storage::disk('uploads')->delete($currentPath);
        }

        return $this->storeBase64File($base64String, $directory);
    }

    protected function notifyUser(int $userId, string $type, string $title, string $message, array $payload = []): void
    {
        DB::table('notifications')->insert([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'payload' => json_encode($payload),
            'is_read' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function notifyUsersByRole(string $role, string $type, string $title, string $message, array $payload = []): void
    {
        $userIds = DB::table('users')->where('role', $role)->pluck('id');

        foreach ($userIds as $userId) {
            $this->notifyUser((int) $userId, $type, $title, $message, $payload);
        }
    }

    protected function refreshOrderTimeline(int $orderId): void
    {
        $order = DB::table('orders')->where('id', $orderId)->first();
        if (! $order) {
            return;
        }

        DB::table('orders')->where('id', $orderId)->update([
            'status_timeline' => json_encode($this->buildOrderTimeline($order)),
            'updated_at' => now(),
        ]);
    }

    protected function buildOrderTimeline(object $order): array
    {
        $timeline = [
            ['status' => 'placed', 'at' => $order->placed_at ?? null],
            ['status' => 'accepted', 'at' => $order->accepted_at ?? null],
            ['status' => 'preparing', 'at' => $order->prepared_at ?? null],
            ['status' => 'ready', 'at' => $order->ready_at ?? null],
            ['status' => 'assigned', 'at' => $order->assigned_at ?? null],
            ['status' => 'picked_up', 'at' => $order->picked_up_at ?? null],
            ['status' => 'out_for_delivery', 'at' => $order->out_for_delivery_at ?? null],
            ['status' => 'delivered', 'at' => $order->delivered_at ?? null],
            ['status' => 'cancelled', 'at' => $order->cancelled_at ?? null],
        ];

        return $this->appendWaitingForDeliveryPartnerStep($order, $timeline);
    }

    protected function normalizeOrderTimeline(object $order, array $timeline): array
    {
        return $this->appendWaitingForDeliveryPartnerStep($order, $timeline);
    }

    protected function appendWaitingForDeliveryPartnerStep(object $order, array $timeline): array
    {
        $request = DB::table('delivery_requests')
            ->select('status', 'created_at')
            ->where('order_id', $order->id)
            ->orderByDesc('id')
            ->first();

        if (! $request || ! in_array($request->status, ['open', 'accepted'], true)) {
            return $timeline;
        }

        foreach ($timeline as $step) {
            if (($step['status'] ?? null) === 'waiting_for_delivery_partner') {
                return $timeline;
            }
        }

        $waitingStep = [
            'status' => 'waiting_for_delivery_partner',
            'at' => $request->created_at ?? $order->ready_at ?? null,
        ];

        $result = [];
        $inserted = false;

        foreach ($timeline as $step) {
            $result[] = $step;
            if (! $inserted && ($step['status'] ?? null) === 'ready') {
                $result[] = $waitingStep;
                $inserted = true;
            }
        }

        if (! $inserted) {
            $result[] = $waitingStep;
        }

        return $result;
    }

    protected function activeStatuses(): array
    {
        return ['active', 'approved'];
    }
}
