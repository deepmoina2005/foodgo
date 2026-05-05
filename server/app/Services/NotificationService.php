<?php

namespace App\Services;

use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationService extends BaseApiService
{
    public function index(Request $request)
    {
        $query = DB::table('notifications')
            ->where('user_id', $this->userId())
            ->select('id', 'type', 'title', 'message', 'payload', 'is_read', 'created_at', 'updated_at')
            ->orderByDesc('id');

        $paginator = $this->paginate($query, $request);
        $notifications = collect($paginator->items())->map(function (object $notification): object {
            $notification->payload = $this->decodePayload($notification->payload ?? null);
            return $notification;
        })->all();

        return ApiResponse::success('Notifications loaded.', [
            'notifications' => $notifications,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'unread_count' => DB::table('notifications')
                ->where('user_id', $this->userId())
                ->where('is_read', false)
                ->count(),
        ]);
    }

    public function read(int $id)
    {
        DB::table('notifications')
            ->where('id', $id)
            ->where('user_id', $this->userId())
            ->update(['is_read' => true, 'updated_at' => now()]);

        return ApiResponse::success('Notification marked as read.');
    }

    public function readAll()
    {
        DB::table('notifications')
            ->where('user_id', $this->userId())
            ->update(['is_read' => true, 'updated_at' => now()]);

        return ApiResponse::success('All notifications marked as read.');
    }

    private function decodePayload(mixed $payload): array
    {
        if (is_array($payload)) {
            return $payload;
        }

        if (is_object($payload)) {
            return (array) $payload;
        }

        if (! is_string($payload) || trim($payload) === '') {
            return [];
        }

        $decoded = json_decode($payload, true);

        return is_array($decoded) ? $decoded : [];
    }
}
