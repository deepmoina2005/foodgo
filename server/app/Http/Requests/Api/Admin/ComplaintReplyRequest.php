<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ComplaintReplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'admin_reply' => ['required', 'string', 'max:5000'],
            'status' => ['required', 'in:pending,in_progress,resolved,rejected'],
        ];
    }
}
