<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

require APPPATH.'/libraries/REST_Controller.php';

class Date4fun extends REST_Controller {

    private $error_code;

    public function __construct()
    {
        parent::__construct();

        $this->load->model('date4fun_model');
        $this->error_code = array(
            'no error' => array('type' => 0, 'message' => 'no error'),
            'not authenticate' => array('type' => 1, 'message' => 'not authenticate'),
            'authenticate failure' => array('type' => 2, 'message' => ''),
            'not exist' => array('type' => 3, 'message' => 'not exist'),
            'already exist' => array('type' => 4, 'message' => 'already exist'),
            'system error' => array('type' => 5, 'message' => 'system error'),
            'db error' => array('type' => 6, 'message' => 'db error'),
            'format error' => array('type' => 7, 'message' => 'format error'),
            'empty data' => array('type' => 8, 'message' => 'empty data'),
            'parse error' => array('type' => 9, 'message' => 'parse error')
        );
    }

    public function action_list_post()
    {
        $relationship = $this->post('relationship');
        $ambiance = $this->post('ambiance');
        $slot = $this->post('slot');
        $date = $this->post('date');

        $data = array(
            'error' => $this->error_code['no error'],
            'data' => array()
        );

        for ($i = 0; $i < 5; $i++) {
            $data['data'][] = $this->date4fun_model->suggestDatingCard(array(
                'relationship' => (int)$relationship - 1,
                'ambiance' => (int)$ambiance - 1,
                'slot' => $slot,
                'date' => $date
            ));
        }

        $this->response($data);
    }

    public function schedule_post()
    {
        $relationship = $this->post('relationship');
        $ambiance = $this->post('ambiance');
        $slot = $this->post('slot');
        $action = $this->post('action');

        $aryActionId = explode(',', $action);

        $data = array(
            'error' => $this->error_code['no error'],
            'data' => array()
        );

        $aryStart = array();
        $aryDuration = array();
        $arySlot = explode(',', $slot);

        if (!empty($arySlot) && sizeof($arySlot) == 2) {
            $from = (int)$arySlot[0];
            $to = (int)$arySlot[1];

            if ($from == 0 && $to >= 1) {
                // morning
                $aryStart[] = 9;
                $aryDuration[] = 3;
            }

            if (
                ($from == 0 && $to == 1) ||
                ($from == 0 && $to == 2) ||
                ($from == 1 && $to == 2)
            ) {
                // lunch
                $aryStart[] = 12;
                $aryDuration[] = 3;
            }

            if ($from <= 1 && $to >= 2) {
                // afternoon
                $aryStart[] = 15;
                $aryDuration[] = 3;
            }

            if (
                ($from == 0 && $to == 3) ||
                ($from == 1 && $to == 3) ||
                ($from == 2 && $to == 3)
            ) {
                // dinner
                $aryStart[] = 18;
                $aryDuration[] = 3;
            }

            if ($from <= 2 && $to == 3) {
                // night
                $aryStart[] = 21;
                $aryDuration[] = 3;
            }
        }

        foreach ($aryActionId as $index => $actionId) {
            if (preg_match('/^[1-9][0-9]*$/', $actionId)) {
                $data['data'][] = $this->date4fun_model->suggestByAction(
                    $actionId,
                    array(
                        'start_time' => @$aryStart[$index] ?: 0,
                        'duration' => @$aryDuration[$index] ?: 0
                    )
                );
            }
        }

        $this->response($data);
    }

    public function detail_post()
    {
        $category = $this->post('category');
        $id = $this->post('id');

        $data = array(
            'error' => $this->error_code['no error']
        );

        $this->response($data);
    }

    public function configuration_get()
    {
        $relationship = $this->get('relationship');
        $ambiance = $this->get('ambiance');
        $slot = $this->get('slot');
        $date = $this->get('date');

        $data = array(
            'error' => $this->error_code['no error'],
            'data' => array(
                'relationship' => $this->date4fun_model->getRelationship(),
                'ambiance' => $this->date4fun_model->getAmbiance(),
                'action' => $this->date4fun_model->getAction()
            )
        );

        $this->response($data);
    }
}

/* End of file date4fun.php */
/* Location: ./application/controllers/date4fun.php */
