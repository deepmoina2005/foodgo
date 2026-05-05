<?php

namespace App\Http\Requests\Api\Delivery;

use Illuminate\Foundation\Http\FormRequest;

class KycRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kyc_document' => ['required', 'file', 'max:5120'],
            'kyc_status' => ['nullable', 'in:pending,approved,rejected'],
        ];
    }
}
