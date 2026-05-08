<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedbacks extends Model
{
    public $timestamps = true;
    protected $table = 'feedbacks';
    protected $fillable = ['ticket_id', 'description', 'rating'];

    public function ticket()
    {
        return $this->belongsTo(Tickets::class, 'ticket_id');
    }

    public static function scopeRating()
    {
        return self::avg('rating');
    }
}
