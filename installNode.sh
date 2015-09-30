
##########Get node latest
sudo apt-get update && sudo apt-get upgrade
sudo apt-get install -y screen build-essential

##########Get node latest
## launch screen : screen 
wget http://nodejs.org/dist/v0.12.7/node-v0.12.7.tar.gz
tar -xzf node-v0.12*
cd node-v0.12*
./configure
make
sudo make install
cd ..
sudo npm intall -g node-gyp
npm install
