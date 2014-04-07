import ctypes, time, http.client, json, re, asyncio

SendInput = ctypes.windll.user32.SendInput

# C struct redefinitions 
PUL = ctypes.POINTER(ctypes.c_ulong)
class KeyBdInput(ctypes.Structure):
    _fields_ = [("wVk", ctypes.c_ushort),
                ("wScan", ctypes.c_ushort),
                ("dwFlags", ctypes.c_ulong),
                ("time", ctypes.c_ulong),
                ("dwExtraInfo", PUL)]

class HardwareInput(ctypes.Structure):
    _fields_ = [("uMsg", ctypes.c_ulong),
                ("wParamL", ctypes.c_short),
                ("wParamH", ctypes.c_ushort)]

class MouseInput(ctypes.Structure):
    _fields_ = [("dx", ctypes.c_long),
                ("dy", ctypes.c_long),
                ("mouseData", ctypes.c_ulong),
                ("dwFlags", ctypes.c_ulong),
                ("time",ctypes.c_ulong),
                ("dwExtraInfo", PUL)]

class Input_I(ctypes.Union):
    _fields_ = [("ki", KeyBdInput),
                 ("mi", MouseInput),
                 ("hi", HardwareInput)]

class Input(ctypes.Structure):
    _fields_ = [("type", ctypes.c_ulong),
                ("ii", Input_I)]

# Actuals Functions

def PressKey(hexKeyCode):

    extra = ctypes.c_ulong(0)
    ii_ = Input_I()
    ii_.ki = KeyBdInput( hexKeyCode, 0x48, 0, 0, ctypes.pointer(extra) )
    x = Input( ctypes.c_ulong(1), ii_ )
    SendInput(1, ctypes.pointer(x), ctypes.sizeof(x))

def ReleaseKey(hexKeyCode):

    extra = ctypes.c_ulong(0)
    ii_ = Input_I()
    ii_.ki = KeyBdInput( hexKeyCode, 0x48, 0x0002, 0, ctypes.pointer(extra) )
    x = Input( ctypes.c_ulong(1), ii_ )
    SendInput(1, ctypes.pointer(x), ctypes.sizeof(x))


def AltTab():
    '''
    Press Alt+Tab and hold Alt key for 2 seconds in order to see the overlay
    '''

    PressKey(0x012) #Alt
    PressKey(0x09) #Tab
    ReleaseKey(0x09) #~Tab

    time.sleep(1)
    ReleaseKey(0x012) #~Alt
	
def pressW():
	PressKey(0x057) #W
	time.sleep(2)
	ReleaseKey(0x057) #W



def http_request():

	global count
	global start_time
	conn = http.client.HTTPConnection('192.168.1.117', 8765)
	conn.request('GET', '/') # <---
	#conn.request('GET')
	response = conn.getresponse()
	data = response.readall().decode('utf-8')
	#print(data)
	#if not group is None :
	
	group = re.search(r'{.*}',data).group()
	j = json.loads(group)
	#print(j)
	
	#j = json.loads(re.search(r'{.*}',response.readall().decode('utf-8').group()))
	#j = json.loads(re.search(r'{.*}',response.readall().decode('utf-8')).group())
	
	#print(j)
	#d = json.loads(r)
	#print(j['sensors'])
	#count = count + 1
	
	#doB()
	
	for sensor in j['sensors']:
		if type(sensor['type']) is str:
			if sensor['type'] == "gravity":
				print(sensor['values'][1])
				#print( (time.time() - start_time) / count)
				if sensor['values'][1] > 1:
					# do press w on another thread (coroutine)
					pressW()
			
	#print(r.read())

def doB():
   global count
   count = count + 1

def main():
	start_time = time.time()
	while True:
		http_request()

if __name__ =="__main__":
	main()
	#AltTab()