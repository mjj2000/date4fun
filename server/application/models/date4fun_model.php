<?php defined('BASEPATH') OR exit('No direct script access allowed');

class Date4fun_model extends CI_Model {

    private $flag = 0;
    private $indexRestaurant = 0;
    private $aryRestaurant = array();
    private $indexActivity = 0;
    private $aryActivity = array();
    private $indexView = 0;
    private $aryView = array();

    public function __construct()
    {
        $this->load->database();
    }

    public function getRelationship()
    {
        $this->db->select('id, name');
        $query = $this->db->get('relationship');

        return $query->result_array();
    }

    public function getAmbiance()
    {
        $this->db->select('id, name');
        $query = $this->db->get('ambiance');

        return $query->result_array();
    }

    public function getAction()
    {
        $this->db->select('id, name, icon');
        $query = $this->db->get('action');

        $return = $query->result_array();

        foreach ($return as $index => $row) {
            if (empty($row['icon'])) {
                $return[$index]['icon'] = '1';
            }
        }

        return $return;
    }

    public function suggestDatingCard($param)
    {
        $card = array();
        $arySlot = explode(',', $param['slot']);

        if (!empty($arySlot) && sizeof($arySlot) == 2) {
            $from = (int)$arySlot[0];
            $to = (int)$arySlot[1];

            if (empty($this->aryView)) {
                $this->db->select('id, name');
                $this->db->from('action');
                $this->db->where(array('action.category' => 'V'));

                if (!empty($param['relationship']))
                    $this->db->like('relationship', '|'. $param['relationship'] .'|');

                if (!empty($param['ambiance']))
                    $this->db->like('ambiance', '|'. $param['ambiance'] .'|');

                $this->db->order_by('id', 'desc');
                $query = $this->db->get();
                $this->aryView = $query->result_array();
            }

            if (empty($this->aryRestaurant)) {
                $this->db->select('id, name');
                $this->db->from('action');
                $this->db->where(array('action.category' => 'R'));

                if (!empty($param['relationship']))
                    $this->db->like('relationship', '|'. $param['relationship'] .'|');

                if (!empty($param['ambiance']))
                    $this->db->like('ambiance', '|'. $param['ambiance'] .'|');

                $this->db->order_by('id', 'desc');
                $query = $this->db->get();
                $this->aryRestaurant = $query->result_array();
            }

            if (empty($this->aryActivity)) {
                $this->db->select('id, name');
                $this->db->from('action');
                $this->db->where(array('action.category' => 'A'));

                if (!empty($param['relationship']))
                    $this->db->like('relationship', '|'. $param['relationship'] .'|');

                if (!empty($param['ambiance']))
                    $this->db->like('ambiance', '|'. $param['ambiance'] .'|');

                $this->db->order_by('id', 'desc');
                $query = $this->db->get();
                $this->aryActivity = $query->result_array();
            }

            if ($from == 0 && $to >= 1) {
                // morning
                $card[] = empty($this->aryView) ? '' : $this->aryView[$this->indexView++]['id'];
                if ($this->indexView >= sizeof($this->aryView))
                    $this->indexView = 0;
            }

            if (
                ($from == 0 && $to == 1) ||
                ($from == 0 && $to == 2) ||
                ($from == 1 && $to == 2)
            ) {
                // lunch
                $card[] = empty($this->aryRestaurant) ? '' : $this->aryRestaurant[$this->indexRestaurant++]['id'];
                if ($this->indexRestaurant >= sizeof($this->aryRestaurant))
                    $this->indexRestaurant = 0;
            }

            if ($from <= 1 && $to >= 2) {
                // afternoon

                if (($from == 0 && $to >= 1) && (empty($this->aryView) || sizeof($this->aryView) == 1)) {
                    // lack of info in view -> not select
                    $this->flag = 1;
                }

                if (($from <= 2 && $to == 3) && (empty($this->aryActivity) || sizeof($this->aryActivity) == 1)) {
                    // lack of info in activity -> not select
                    $this->flag = 0;
                }

                if ($this->flag == 0) {
                    $this->flag = 1;
                    $card[] = empty($this->aryView) ? '' : $this->aryView[$this->indexView++]['id'];
                    if ($this->indexView >= sizeof($this->aryView))
                        $this->indexView = 0;
                } else {
                    $this->flag = 0;
                    $card[] = empty($this->aryActivity) ? '' : $this->aryActivity[$this->indexActivity++]['id'];
                    if ($this->indexActivity >= sizeof($this->aryActivity))
                        $this->indexActivity = 0;
                }
            }

            if (
                ($from == 0 && $to == 3) ||
                ($from == 1 && $to == 3) ||
                ($from == 2 && $to == 3)
            ) {
                // dinner

                if (!empty($this->aryRestaurant) && $this->aryRestaurant[$this->indexRestaurant]['name'] == '早餐') {
                    // skip the action in morning
                    $this->indexRestaurant++;
                    if ($this->indexRestaurant >= sizeof($this->aryRestaurant))
                        $this->indexRestaurant = 0;
                }

                $card[] = empty($this->aryRestaurant) ? '' : $this->aryRestaurant[$this->indexRestaurant++]['id'];
                if ($this->indexRestaurant >= sizeof($this->aryRestaurant))
                    $this->indexRestaurant = 0;
            }

            if ($from <= 2 && $to == 3) {
                // night
                $card[] = empty($this->aryActivity) ? '' : $this->aryActivity[$this->indexActivity++]['id'];
                if ($this->indexActivity >= sizeof($this->aryActivity))
                    $this->indexActivity = 0;
            }
        }

        return $card; 
    }

    public function suggestByAction($actionId, $param)
    {
        $this->db->select('*');
        $query = $this->db->get_where('action', array('id' => $actionId));
        $actionRes = $query->result_array();

        if (empty($actionRes)) {
            return array(
                'category' => '',
                'action' => $actionId,
                'start_time' => $param['start_time'],
                'duration' => $param['duration'],
                'options' => array()
            );
        }

        $category = $actionRes[0]['category'];

        $this->db->select('*');
        $this->db->from('type');
        switch ($category) {
            case 'R':
                $this->db->join('restaurant', 'restaurant.type_id = type.id', 'inner');
                break;
            case 'V':
                $this->db->join('view', 'view.type_id = type.id', 'inner');
                break;
            case 'A':
                if ($actionRes[0]['name'] == '電影') {
                    $this->db->join('movie', 'movie.type_id = type.id', 'inner');
                } else {
                    $this->db->join('activity', 'activity.type_id = type.id', 'inner');
                }
                break;
        }
        $this->db->where(array('type.action_id' => $actionId));
        $this->db->limit(10);
        $this->db->order_by('value', 'desc');
        $query = $this->db->get();

        $return = array(
            'category' => $category,
            'action' => $actionId,
            'start_time' => $param['start_time'],
            'duration' => $param['duration'],
            'options' => $query->result_array()
        );

        foreach ($return['options'] as $index => $row) {
            if (empty($row['image_url'])) {
                unset($return['options'][$index]);
            }

            if (preg_match('/，網友認為值得推薦的有.*/', $row['description'])) {
                $return['options'][$index]['description'] = preg_replace('/(.*)網友認為值得推薦的有：、.*/', '$1' , $row['description']); 
            }
        }

        $return['options'] = array_values($return['options']);

        return $return;
    }
}

/* End of file date4fun_model.php */
/* Location: ./application/config/date4fun_model.php */
