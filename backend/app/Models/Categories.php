<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Categories extends Model
{
    public $timestamps = true;
    protected $table = 'categories';
    protected $fillable = ['name'];

    public function tickets()
    {
        return $this->hasMany(Tickets::class, 'problem_category_id');
    }
}
