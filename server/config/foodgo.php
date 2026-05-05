<?php

return [
    'pricing' => [
        'gst_percentage' => (float) env('FOODGO_GST_PERCENT', 5),
        'default_delivery_charge' => (float) env('FOODGO_DELIVERY_CHARGE', 40),
        'platform_fee' => (float) env('FOODGO_PLATFORM_FEE', 5),
    ],
];
