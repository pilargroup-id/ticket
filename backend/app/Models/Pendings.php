<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pendings extends Model
{
    use HasFactory;
    public $timestamps = true;
    protected $table = 'project_on_holds';
    protected $fillable = [
        'project_header_id',
        'hold_start',
        'hold_end',
        'reason',
        'duration_minutes',
    ];


     public function projectHeader()
    {
        return $this->belongsTo(ProjectHeaders::class, 'project_header_id')->withTrashed();
    }

}
