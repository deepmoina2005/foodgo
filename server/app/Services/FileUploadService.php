<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

class FileUploadService extends BaseApiService
{
    public function store(?UploadedFile $file, string $directory): ?string
    {
        return $this->storeFile($file, $directory);
    }

    public function replace(?UploadedFile $file, ?string $currentPath, string $directory): ?string
    {
        return $this->replaceFile($file, $currentPath, $directory);
    }
}
