<?php

namespace App\Http\Requests\Api\Customer;

use Illuminate\Foundation\Http\FormRequest;

class ReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'order_id' => ['required', 'integer', 'exists:orders,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
            'restaurant_id' => ['nullable', 'integer', 'exists:restaurants,id'],
            'food_item_id' => ['nullable', 'integer', 'exists:food_items,id'],
            'delivery_partner_id' => ['nullable', 'integer', 'exists:delivery_partners,id'],
        ];
    }
}
