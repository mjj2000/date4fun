<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Account extends CI_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->load->model('account_model');
    }

    public function login()
    {
        $username = $this->input->post('username');
        $password = $this->input->post('password');

        $data = array(
            'error' => 0,
            'status' => 0,
            'role' => 0,
            'name' => ''
        );

        $this->load->view('json', array('data' => $data));
    }

    public function forgot_password()
    {
        $username = $this->input->post('username');

        $data = array(
            'error' => 0
        );

        $this->load->view('json', array('data' => $data));
    }

    public function register()
    {
        $username = $this->input->post('username');
        $password = $this->input->post('password');

        $data = array(
            'error' => 0
        );

        $this->load->view('json', array('data' => $data));
    }
}

/* End of file account.php */
/* Location: ./application/controllers/account.php */
