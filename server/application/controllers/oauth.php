<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Oauth extends CI_Controller
{
    public function google()
    {
        $this->load->spark('oauth2/0.4.0');
        $this->load->library('session');
        $this->load->helper('url_helper');

        $provider = $this->oauth2->provider('google', array(
            'id' => '539405454105.apps.googleusercontent.com',
            'secret' => 'xEqRS4MLrRP_Lvls8hjz6b_8',
        ));

        if ( ! $this->input->get('code')) {
            $url = $provider->authorize();
            redirect($url);
        } else {
            try {
                $token = $provider->access($this->input->get('code'));
                $user = $provider->get_user_info($token);
                echo "<pre>Tokens: ";
                var_dump($token);
                echo "\n\nUser Info: ";
                var_dump($user);
            } catch (OAuth2_Exception $e) {
                show_error('That didnt work: '.$e);
            }
        }
    }
}

/* End of file oauth.php */
/* Location: ./application/controllers/oauth.php */
