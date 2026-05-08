<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Assets extends Model
{
  public $timestamps = true;
  protected $table = 'assets';
  protected $primaryKey = 'id';
  protected $fillable = [
    'assets_code',
    'assets_name',
    'category',
    'status',
    'model',
    'check_in',
    'check_out',
    'check_out_to',
    'location',
    'notes',
  ];
}
