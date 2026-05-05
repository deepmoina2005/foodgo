<?php

namespace App\Http\Requests\Api\Customer;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'address_id' => ['required', 'integer', 'exists:addresses,id'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'customer_note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
