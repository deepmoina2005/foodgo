<?php

namespace App\Constants;

final class OrderStatus
{
    public const PLACED = 'placed';
    public const ACCEPTED = 'accepted';
    public const PREPARING = 'preparing';
    public const READY = 'ready';
    public const ASSIGNED = 'assigned';
    public const PICKED_UP = 'picked_up';
    public const OUT_FOR_DELIVERY = 'out_for_delivery';
    public const DELIVERED = 'delivered';
    public const CANCELLED = 'cancelled';
}
