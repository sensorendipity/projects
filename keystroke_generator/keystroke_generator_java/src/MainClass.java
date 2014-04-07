import java.awt.AWTException;
import java.awt.Robot;
import java.awt.event.KeyEvent;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.http.HttpClientConnection;
import org.apache.http.HttpEntity;
import org.apache.http.HttpHost;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.conn.ConnectionPoolTimeoutException;
import org.apache.http.conn.ConnectionRequest;
import org.apache.http.conn.HttpClientConnectionManager;
import org.apache.http.conn.routing.HttpRoute;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.BasicHttpClientConnectionManager;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.protocol.HttpContext;
import org.apache.http.util.EntityUtils;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.JSONValue;
/*import org.apache.commons.httpclient.*;
import org.apache.commons.httpclient.methods.*;
import org.apache.commons.httpclient.params.HttpMethodParams;*/

public class MainClass {
	public static void main(String [] argv) throws Exception {
		/*press_key(KeyEvent.VK_D);
		press_key(KeyEvent.VK_E);
		press_key(KeyEvent.VK_A);
		press_key(KeyEvent.VK_T);
		press_key(KeyEvent.VK_H);*/
		//press_w();
		
		System.out.println("Testing 1 - Send Http GET request");
		
		//test_parse(sendGet());
		
		//init_https_request();
		
		start_polling();
		//test_apache2();
	}
	
	protected void finalize() throws Exception {
		System.out.println("program finalized");
		//in.close();
	}
	
	public static void start_polling() {
		TimerTask task = new TimerTask() {
			
			double prev_value = -1;
			int request_count = 0;
			int fail_count = 0;
			long start_time = System.currentTimeMillis();
			long curr_time = System.currentTimeMillis();
			
			public long get_duration() {
				curr_time = System.currentTimeMillis();
				return curr_time - start_time;
			}
			
			@Override
			public void run() {
				String json_str=null;
				try {
					json_str = init_apache();
					//System.out.println("json_str " +json_str);
				} catch (Exception e) {
					e.printStackTrace();
				}
				if (json_str != null ) {
					
					JSONArray sensor_array = get_sensor_array(json_str);
					JSONArray gravity_array = get_gravity_value(sensor_array);
					JSONArray acc_array = get_accelerometer_value(sensor_array);
					
					Double a1=0.0,a2=0.0,g1=0.0;
					
					if (acc_array != null) {
						a1 = (Double) acc_array.get(0);
						a2 = (Double) acc_array.get(1);
					}
					
					if (acc_array != null) {
						g1 = (Double) gravity_array.get(0);
					}
					
					//System.out.println("value here "+value);
					if (g1 != null && prev_value != g1) {
						prev_value = g1;
						
						request_count++;
						
						if (gravity_array != null ) {
							  gravity1_total += (Double) gravity_array.get(0);
							  gravity2_total += (Double) gravity_array.get(1);
							  gravity3_total += (Double) gravity_array.get(2);
							  
							  /*if (gravity1_total > g1max)
								  g1max = (Double) gravity_array.get(0);
							  if (gravity1_total < g1min)
								  g1min = (Double) gravity_array.get(0);
							  
							  if (gravity1_total > g1max)
								  g1max = (Double) gravity_array.get(0);
							  if (gravity1_total < g1min)
								  g1min = (Double) gravity_array.get(0);
							  
							  if (gravity1_total > g1max)
								  g1max = (Double) gravity_array.get(0);
							  if (gravity1_total < g1min)
								  g1min = (Double) gravity_array.get(0);*/
						}
						
						if(a1 > 5)
							System.out.println("a1 trip");
						if(a2 > 10)
							System.out.println("a2 trip");
						if(g1 > 3)
							System.out.println("g1 trip "+g1);
						
						if (a1 > 5.0 || a2 > 10.0 || g1 > 3.0)
							press_key(KeyEvent.VK_W);
						
						
					} else {
						//System.out.println(prev_value + " " + value);
						fail_count++;
					}
					
					//System.out.println("gravity value "+value);
				}
				//System.out.println("rate so far "+ (((double)request_count)/get_duration()) * 1000);
				//System.out.println("fail so far "+ (((double)fail_count)/get_duration()) * 1000);
				System.out.println("g1 mean "+gravity1_total / (double) request_count);
				System.out.println("g2 mean "+gravity2_total / (double) request_count);
				System.out.println("g3 mean "+gravity3_total / (double) request_count);
			}
		};
		
		
		(new Timer()).scheduleAtFixedRate(task, 0, 10);//(long) Math.floor(1000/50.0)

		/*scheduleAtFixedRate
		public void scheduleAtFixedRate(TimerTask task,
		                                long delay,
		                                long period)*/
	}
	
	static AtomicInteger walking_count = new AtomicInteger(0);
	public static void press_key(final int keycode) {
		
		final Thread key_thread = new Thread(new Runnable() {
	        public void run() {
	        	try {
	    	        Robot robot = new Robot();
	    	        // Simulate a key press
	    	        robot.keyPress(keycode);
	    	        walking_count.getAndIncrement();
	    	        Thread.sleep(1000);
	    	        
	    	        if (walking_count.get() == 1)
	    	        	robot.keyRelease(keycode);
	    	        
	    	        walking_count.getAndDecrement();
	    		} catch (AWTException e) {
	    			e.printStackTrace();
	    		} catch ( InterruptedException e) {
	    			e.printStackTrace();
				}
	        }
	    });
		key_thread.start();
	}
	
	public static void press_w() {
		try {
			// Simulate a mouse click
	        //robot.mousePress(InputEvent.BUTTON1_MASK);
	        //robot.mouseRelease(InputEvent.BUTTON1_MASK);
	        Robot robot = new Robot();
	        // Simulate a key press
	        robot.keyPress(KeyEvent.VK_W);
	        robot.keyRelease(KeyEvent.VK_W);

		} catch (AWTException e) {
		        e.printStackTrace();
		}
	}
	
	private static final String USER_AGENT = "Mozilla/5.0";
	//static BufferedReader in;
	
	private static void init_https_request() throws Exception {
		String url = "http://192.168.1.117:8765";
		URL obj = new URL(url);
		
		con = (HttpURLConnection) obj.openConnection();
		
		// optional default is GET
		con.setRequestMethod("GET");
	 
		//add request header
		//con.setRequestProperty("User-Agent", USER_AGENT);
		
		con.setRequestProperty("Connection", "Keep-Alive");
	}
	
	static HttpURLConnection con;
	
	// HTTP GET request
	private static String sendGet() throws Exception{
			
		String inputLine;
		StringBuffer response = new StringBuffer();
		
		int responseCode = con.getResponseCode();
		//System.out.println("\nSending 'GET' request to URL : " + url);
		System.out.println("Response Code : " + responseCode);
		
		BufferedReader in = new BufferedReader(
		        new InputStreamReader(con.getInputStream()));
		
		while ((inputLine = in.readLine()) != null) {
			response.append(inputLine);
		}
 
		
		in.close();
		//print result
		return response.toString();
	}
	
	static double gravity1_total=0, gravity2_total=0, gravity3_total=0;
	static double g1max = -99 , g1min= 99, g2max= -99 , g2min= 99, g3max=-99 , g3min= 99;
	
	public static JSONArray get_sensor_array(String json_str) {
		
		if (json_str.length() != 0) {
			  Object obj=JSONValue.parse(json_str);
			  JSONObject json_obj = (JSONObject) obj;
			  
			  //System.out.println(json_obj.get("sensors"));
			  //System.out.println("json_obj here "+obj);
			  JSONArray sensor_array = (JSONArray) json_obj.get("sensors");
			  
			  return sensor_array;
		} else return null;
	}
	
	// json_str has to be non null
	public static JSONArray get_gravity_value(JSONArray sensor_array) {
		
		//System.out.println("json str ");
		//System.out.println(json_str.length());
		
		//System.out.println("json_str in get gravity "+json_str.length());
		
		  //System.out.println("sensor array "+sensor_array);
		  
		  JSONArray gravity_array=null;
		  for (int i = 0; i < sensor_array.size(); i++) {
			  JSONObject curr_obj = (JSONObject) sensor_array.get(i);
			  //System.out.println("curr obj "+curr_obj);
			  if (curr_obj != null ) {
				  if (curr_obj.get("type") != null) {
					  //System.out.println(" get type "+curr_obj.get("type"));
					  if (curr_obj.get("type").equals("gravity")) {
						  gravity_array = (JSONArray) curr_obj.get("values");
					  }
				  } else {
					  System.out.println("Disconnected!");
				  }
			  } else {
				  System.out.println("curr_obj null ");
			  }
		  }
		  
		  //System.out.println("gravity array "+gravity_array);
		  if (gravity_array != null) {
			  //return (Double) gravity_array.get(1);
			  return gravity_array;
		  } else 
			  return null;
	}
	
	public static JSONArray get_accelerometer_value(JSONArray sensor_array) {
		
		//System.out.println("json str ");
		//System.out.println(json_str.length());
		
		//System.out.println("json_str in get gravity "+json_str.length());
		
		  //System.out.println("sensor array "+sensor_array);
		  
		  JSONArray acc_array=null;
		  for (int i = 0; i < sensor_array.size(); i++) {
			  JSONObject curr_obj = (JSONObject) sensor_array.get(i);
			  //System.out.println("curr obj "+curr_obj);
			  if (curr_obj != null ) {
				  if (curr_obj.get("type") != null) {
					  if (curr_obj.get("type").equals("accelerometer")) {
						  acc_array = (JSONArray) curr_obj.get("values");
					  }
				  } else {
					  System.out.println("Disconnected!");
				  }
			  } else {
				  System.out.println("curr_obj null ");
			  }
		  }
		  
		  //System.out.println("gravity array "+gravity_array);
		  if (acc_array != null) {
			  //return (Double) gravity_array.get(1);
			  return acc_array;
		  } else 
			  return null;
	}
	
	static PoolingHttpClientConnectionManager connMrg;
	static ConnectionRequest connRequest;
	static HttpClientConnection conn;
	static HttpRoute route;
	public static String init_apache() throws Exception {
		HttpClientContext context = HttpClientContext.create();
		//connMrg = new BasicHttpClientConnectionManager();
		connMrg = new PoolingHttpClientConnectionManager();
		route = new HttpRoute(new HttpHost("192.168.1.117", 8765));
		// Request new connection. This can be a long process
		connRequest = connMrg.requestConnection(route, null);
		// Wait for connection up to 10 sec
		try {
			conn = connRequest.get(10, TimeUnit.SECONDS);
		} catch (ConnectionPoolTimeoutException | InterruptedException
				| ExecutionException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		String input_line = "";
		StringBuffer response_strbuf = new StringBuffer();
		//BufferedReader in=null;
		String to_return="";
		HttpEntity entity=null;
		CloseableHttpClient httpclient=null;
		CloseableHttpResponse response=null;
		
		try {
		    // If not open
		    if (!conn.isOpen()) {
		        // establish connection based on its route info
		        connMrg.connect(conn, route, 1000, context);
		        // and mark it as route complete
		        connMrg.routeComplete(conn, route, context);
		    }
		    
		    
		    
		    // Do useful things with the connection.
			
			/*if (connMrg != null ) {
				httpclient = HttpClients.custom()
			        .setConnectionManager(connMrg)
			        .build();
			} else { 	
				httpclient = HttpClients.createDefault();
			}*/
			
			
			httpclient = HttpClients.custom()
			        .setConnectionManager(connMrg)
			        .build();
		    
			
			HttpGet httpget = new HttpGet("http://192.168.1.117:8765");
			
			try {
				response = httpclient.execute(httpget, context);
			} catch ( IllegalStateException e) {
				// TODO Auto-generated catch block
				System.out.println("execute problem");
				e.printStackTrace();
			}
			
			
		    entity = response.getEntity();
		    //System.out.println("len "+entity.getContentLength());
		    if (entity != null) {
		        long len = entity.getContentLength();
		        if (len != -1 && len < 2048) {
		        	to_return = EntityUtils.toString(entity);
		            //System.out.println(to_return);
		            
		        } else {
		            // Stream content out
		        	//System.out.println("too big ");
		        	
		        	String inputLine;
		    		response_strbuf = new StringBuffer();
		    		
		    		//int responseCode = con.getResponseCode();
		    		//System.out.println("\nSending 'GET' request to URL : " + url);
		    		//System.out.println("Response Code : " + responseCode);
		    		
		    		BufferedReader in = new BufferedReader(
		    		        new InputStreamReader(entity.getContent()));
		    		
		    		while ((inputLine = in.readLine()) != null) {
		    			response_strbuf.append(inputLine);
		    		}
		     
		    		
		    		in.close();
		    		to_return = response_strbuf.toString();
		        }
		    }
		    
		} finally {
		   
		    //httpclient.close();
		    EntityUtils.consume(entity);
		    connMrg.releaseConnection(conn, null, 1, TimeUnit.SECONDS);
		    //conn.close();
		    //connMrg.shutdown();
		}
		
		return to_return;
		
		
	}
}
