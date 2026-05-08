<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Departments extends Model
{   
    public $timestamps = true;
    protected $table ='departments';
    protected $primaryKey = 'id';
    protected $fillable =['location_id','name'];

   public function location()
   {
       return $this->belongsTo(Locations::class,'location_id');
   }
}
