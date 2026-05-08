<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Locations extends Model
{   
    protected $table = 'locations';
    protected $fillable = ['name',];
    public $timestamps = true;
    
    public function departments()
    {
        return $this->hasMany(Departments::class);
    }
}