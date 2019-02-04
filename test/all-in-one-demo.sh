#!/bin/bash

set -ex

# set environments
URL=127.0.0.1:3414

# create channel12
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "channelName": "channel12",
  "includeOrgNames": ["Org1", "Org2"],
  "ordererName": "orderer.example.com",
  "orgName": "Org1"
}' \
 "http://$URL/channel/create"

# create channel123
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "channelName": "channel123",
  "includeOrgNames": ["Org1", "Org2", "Org3"],
  "ordererName": "orderer.example.com",
  "orgName": "Org1"
}' \
 "http://$URL/channel/create"

# join channel12 - Org1
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "channelName": "channel12",
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com"]
}' \
 "http://$URL/channel/join"

# join channel12 - Org2
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "channelName": "channel12",
  "orderers": ["orderer.example.com"],
  "orgName": "Org2",
  "peers": ["peer0.org2.example.com","peer1.org2.example.com"]
}' \
 "http://$URL/channel/join"

# join channel123 - Org1
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "channelName": "channel123",
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com"]
}' \
 "http://$URL/channel/join"

# join channel123 - Org2
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "channelName": "channel123",
  "orderers": ["orderer.example.com"],
  "orgName": "Org2",
  "peers": ["peer0.org2.example.com","peer1.org2.example.com"]
}' \
 "http://$URL/channel/join"

# join channel123 - Org3
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "channelName": "channel123",
  "orderers": ["orderer.example.com"],
  "orgName": "Org3",
  "peers": ["peer0.org3.example.com","peer1.org3.example.com"]
}' \
 "http://$URL/channel/join"

# install chaincode - Org1
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "localPath": "chaincode/allInOne",
  "chaincodePath": "github.com/chaincode",
  "chaincode": "",
  "chaincodeName": "mycc",
  "chaincodeType": "golang",
  "chaincodeVersion": "v1.0",
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com"]
}' \
 "http://$URL/chaincode/install"

# install chaincode - Org2
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "localPath": "chaincode/allInOne",
  "chaincodePath": "github.com/chaincode",
  "chaincode": "",
  "chaincodeName": "mycc",
  "chaincodeType": "golang",
  "chaincodeVersion": "v1.0",
  "orgName": "Org2",
  "peers": ["peer0.org2.example.com","peer1.org2.example.com"]
}' \
 "http://$URL/chaincode/install"

# instantiate chaincode on channel12
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "chaincodeName": "mycc",
  "chaincodeType": "golang",
  "chaincodeVersion": "v1.0",
  "channelName": "channel12",
  "collection": "WwogIHsKICAgICJuYW1lIjogImNvbGxlY3Rpb25QTyIsCiAgICAicG9saWN5IjogewogICAgICAiaWRlbnRpdGllcyI6IFsKICAgICAgICB7CiAgICAgICAgICAicm9sZSI6IHsKICAgICAgICAgICAgIm5hbWUiOiAibWVtYmVyIiwKICAgICAgICAgICAgIm1zcElkIjogIk9yZzFNU1AiCiAgICAgICAgICB9CiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAicm9sZSI6IHsKICAgICAgICAgICAgIm5hbWUiOiAibWVtYmVyIiwKICAgICAgICAgICAgIm1zcElkIjogIk9yZzJNU1AiCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdLAogICAgICAicG9saWN5IjogewogICAgICAgICIxLW9mIjogWwogICAgICAgICAgewogICAgICAgICAgICAic2lnbmVkLWJ5IjogMAogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgInNpZ25lZC1ieSI6IDEKICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICAicmVxdWlyZWRQZWVyQ291bnQiOiAxLAogICAgIm1heFBlZXJDb3VudCI6IDMsCiAgICAiYmxvY2tUb0xpdmUiOiAxMDAwMDAwCiAgfSwKICB7CiAgICAibmFtZSI6ICJjb2xsZWN0aW9uUE9Qcml2YXRlRGV0YWlscyIsCiAgICAicG9saWN5IjogewogICAgICAiaWRlbnRpdGllcyI6IFsKICAgICAgICB7CiAgICAgICAgICAicm9sZSI6IHsKICAgICAgICAgICAgIm5hbWUiOiAibWVtYmVyIiwKICAgICAgICAgICAgIm1zcElkIjogIk9yZzFNU1AiCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdLAogICAgICAicG9saWN5IjogewogICAgICAgICIxLW9mIjogWwogICAgICAgICAgewogICAgICAgICAgICAic2lnbmVkLWJ5IjogMAogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgICJyZXF1aXJlZFBlZXJDb3VudCI6IDEsCiAgICAibWF4UGVlckNvdW50IjogMywKICAgICJibG9ja1RvTGl2ZSI6IDMKICB9Cl0K",
  "endorsementPolicy": "ewogICJpZGVudGl0aWVzIjogWwogICAgewogICAgICAicm9sZSI6IHsKICAgICAgICAibmFtZSI6ICJtZW1iZXIiLAogICAgICAgICJtc3BJZCI6ICJPcmcxTVNQIgogICAgICB9CiAgICB9LAogICAgewogICAgICAicm9sZSI6IHsKICAgICAgICAibmFtZSI6ICJtZW1iZXIiLAogICAgICAgICJtc3BJZCI6ICJPcmcyTVNQIgogICAgICB9CiAgICB9CiAgXSwKICAicG9saWN5IjogewogICAgIjEtb2YiOiBbCiAgICAgIHsKICAgICAgICAic2lnbmVkLWJ5IjogMAogICAgICB9LAogICAgICB7CiAgICAgICAgInNpZ25lZC1ieSI6IDEKICAgICAgfQogICAgXQogIH0KfQ==",
  "functionName": "",
  "args": [],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"]
}' \
 "http://$URL/chaincode/instantiate"

# invoke PO - channel12
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "uploadPO",
  "args": ["{\"seller\": \"seller1\", \"consignee\": \"Qing Xia\", \"shipment\": \"fly\", \"destination\": \"china\", \"insureInfo\": \"test insure info\", \"tradeTerms\": \"test trade terms\", \"totalCurrency\": \"RMB\", \"buyer\": \"buyer test\", \"trafMode\": \"123456789\", \"goodsInfos\": {\"unitPrice\": 1233.00, \"amount\": 1521522.00, \"quantity\": 1234, \"delDate\": \"20180926120000\", \"quantityCode\": \"thousand\", \"goodsModel\": \"goods models test\", \"goodNo\": \"goodtest\", \"priceCode\": \"YUAN\", \"goodsName\": \"goods Name test\", \"goodsDescription\": \"goods description test\"}, \"totalAmount\": 1521522.00, \"carrier\": \"ShunFeng\", \"poNo\": \"poNo001\", \"sender\": \"Ye Yu\", \"poDate\": \"20180926120000\", \"tradeCountry\": \"US\"}"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com"]
}' \
 "http://$URL/invoke/channel12/mycc"

# query PO - channel12
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryPO",
  "args": ["poNo001"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# query PO history - channel12
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryPOHistory",
  "args": ["poNo001"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# rich query PO - equal
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "richQueryPO",
  "args": ["{\"selector\":{\"goodsInfos.goodNo\":\"goodtest\"}}"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# rich query PO - equal with pagination
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "richQueryPO",
  "args": ["{\"selector\":{\"goodsInfos.goodNo\":\"goodtest\"}}", "1", ""],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# invoke PO - encrypt all
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "uploadPOEncAll",
  "args": ["{\"seller\": \"seller1\", \"consignee\": \"Qing Xia\", \"shipment\": \"fly\", \"destination\": \"china\", \"insureInfo\": \"test insure info\", \"tradeTerms\": \"test trade terms\", \"totalCurrency\": \"RMB\", \"buyer\": \"buyer test\", \"trafMode\": \"123456789\", \"goodsInfos\": {\"unitPrice\": \"1233.00\", \"amount\": \"1521522.00\", \"quantity\": \"1234\", \"delDate\": \"20180926120000\", \"quantityCode\": \"thousand\", \"goodsModel\": \"goods models test\", \"goodNo\": \"goodtest\", \"priceCode\": \"YUAN\", \"goodsName\": \"goods Name test\", \"goodsDescription\": \"goods description test\"}, \"totalAmount\": \"1521522.00\", \"carrier\": \"ShunFeng\", \"poNo\": \"poNo001\", \"sender\": \"Ye Yu\", \"poDate\": \"20180926120000\", \"tradeCountry\": \"US\"}"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com", "peer0.org2.example.com"],
  "transient": {
    "ENCKEY": "XCcMnNlh0vekZYXz8ZIjUZ8QOMjFUzVDrwg1mrfJZas="
  }
}' \
 "http://$URL/invoke/channel12/mycc"

# query PO - decrypt all
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryPODecAll",
  "args": ["poNo001"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"],
  "transient": {
    "DECKEY": "XCcMnNlh0vekZYXz8ZIjUZ8QOMjFUzVDrwg1mrfJZas="
  }
}' \
 "http://$URL/query/channel12/mycc"

# invoke PO - encrypt part
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "uploadPOEncPart",
  "args": ["{\"seller\": \"seller2\", \"consignee\": \"Qing Xia\", \"shipment\": \"fly\", \"destination\": \"china\", \"insureInfo\": \"test insure info\", \"tradeTerms\": \"test trade terms\", \"totalCurrency\": \"RMB\", \"buyer\": \"buyer test\", \"trafMode\": \"123456789\", \"goodsInfos\": {\"unitPrice\": \"1233.00\", \"amount\": \"1521522.00\", \"quantity\": \"1234\", \"delDate\": \"20180926120000\", \"quantityCode\": \"thousand\", \"goodsModel\": \"goods models test\", \"goodNo\": \"goodtest\", \"priceCode\": \"YUAN\", \"goodsName\": \"goods Name test\", \"goodsDescription\": \"goods description test\"}, \"totalAmount\": \"1521522.00\", \"carrier\": \"ShunFeng\", \"poNo\": \"poNo002\", \"sender\": \"Ye Yu\", \"poDate\": \"20180926120000\", \"tradeCountry\": \"US\"}"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com", "peer0.org2.example.com"],
  "transient": {
    "ENCKEY": "XCcMnNlh0vekZYXz8ZIjUZ8QOMjFUzVDrwg1mrfJZas="
  }
}' \
 "http://$URL/invoke/channel12/mycc"

# query PO - decrypt part
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryPODecPart",
  "args": ["poNo002"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"],
  "transient": {
    "DECKEY": "XCcMnNlh0vekZYXz8ZIjUZ8QOMjFUzVDrwg1mrfJZas="
  }
}' \
 "http://$URL/query/channel12/mycc"

# invoke PO - encrypt part and sign
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "uploadPOEncPartSign",
  "args": ["{\"seller\": \"seller3\", \"consignee\": \"Qing Xia\", \"shipment\": \"fly\", \"destination\": \"china\", \"insureInfo\": \"test insure info\", \"tradeTerms\": \"test trade terms\", \"totalCurrency\": \"RMB\", \"buyer\": \"buyer test\", \"trafMode\": \"123456789\", \"goodsInfos\": {\"unitPrice\": \"1233.00\", \"amount\": \"1521522.00\", \"quantity\": \"1234\", \"delDate\": \"20180926120000\", \"quantityCode\": \"thousand\", \"goodsModel\": \"goods models test\", \"goodNo\": \"goodtest\", \"priceCode\": \"YUAN\", \"goodsName\": \"goods Name test\", \"goodsDescription\": \"goods description test\"}, \"totalAmount\": \"1521522.00\", \"carrier\": \"ShunFeng\", \"poNo\": \"poNo003\", \"sender\": \"Ye Yu\", \"poDate\": \"20180926120000\", \"tradeCountry\": \"US\"}"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com", "peer0.org2.example.com"],
  "transient": {
    "ENCKEY": "XCcMnNlh0vekZYXz8ZIjUZ8QOMjFUzVDrwg1mrfJZas=",
    "SIGKEY": "LS0tLS1CRUdJTiBFQyBQUklWQVRFIEtFWS0tLS0tCk1IY0NBUUVFSUNYK05Eb0NRMTROQkprYVAvYkhjSUpGbVN3ckc3UmNnYTlRRWQ3Y3pxV2lvQW9HQ0NxR1NNNDkKQXdFSG9VUURRZ0FFMlo5RWkyV3F2MWdEeFhHd1cxRCtacHdsV1dQYXFPNFdES3E4d08zL3RmWmp3bi93TGVFTQp4cUZYWjdjQ2M5SjZEZGdYSzY2T3V6UFpwWitjUldCU3R3PT0KLS0tLS1FTkQgRUMgUFJJVkFURSBLRVktLS0tLQo="
  }
}' \
 "http://$URL/invoke/channel12/mycc"

# query PO - decrypt part and verify signature
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryPODecPartVerify",
  "args": ["poNo003"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"],
  "transient": {
    "DECKEY": "XCcMnNlh0vekZYXz8ZIjUZ8QOMjFUzVDrwg1mrfJZas=",
    "VERKEY": "LS0tLS1CRUdJTiBFQyBQUklWQVRFIEtFWS0tLS0tCk1IY0NBUUVFSUNYK05Eb0NRMTROQkprYVAvYkhjSUpGbVN3ckc3UmNnYTlRRWQ3Y3pxV2lvQW9HQ0NxR1NNNDkKQXdFSG9VUURRZ0FFMlo5RWkyV3F2MWdEeFhHd1cxRCtacHdsV1dQYXFPNFdES3E4d08zL3RmWmp3bi93TGVFTQp4cUZYWjdjQ2M5SjZEZGdYSzY2T3V6UFpwWitjUldCU3R3PT0KLS0tLS1FTkQgRUMgUFJJVkFURSBLRVktLS0tLQo="
  }
}' \
 "http://$URL/query/channel12/mycc"

# invoke - encrypt common
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "uploadEncAll",
  "args": ["commonKey010", "{\"seller\": \"seller2\", \"consignee\": \"Qing Xia\", \"shipment\": \"fly\", \"destination\": \"china\", \"insureInfo\": \"test insure info\", \"tradeTerms\": \"test trade terms\", \"totalCurrency\": \"RMB\", \"buyer\": \"buyer test\", \"trafMode\": \"123456789\", \"goodsInfos\": {\"unitPrice\": \"1233.00\", \"amount\": \"1521522.00\", \"quantity\": \"1234\", \"delDate\": \"20180926120000\", \"quantityCode\": \"thousand\", \"goodsModel\": \"goods models test\", \"goodNo\": \"goodtest\", \"priceCode\": \"YUAN\", \"goodsName\": \"goods Name test\", \"goodsDescription\": \"goods description test\"}, \"totalAmount\": \"1521522.00\", \"carrier\": \"ShunFeng\", \"poNo\": \"poNo002\", \"sender\": \"Ye Yu\", \"poDate\": \"20180926120000\", \"tradeCountry\": \"US\"}"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com", "peer0.org2.example.com"],
  "transient": {
    "ENCKEY": "XCcMnNlh0vekZYXz8ZIjUZ8QOMjFUzVDrwg1mrfJZas="
  }
}' \
 "http://$URL/invoke/channel12/mycc"

# query - decrypt common
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryDecAll",
  "args": ["commonKey010"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"],
  "transient": {
    "DECKEY": "XCcMnNlh0vekZYXz8ZIjUZ8QOMjFUzVDrwg1mrfJZas="
  }
}' \
 "http://$URL/query/channel12/mycc"

# invoke PO update private data
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "uploadPOWithPrivate",
  "args": ["{\"seller\": \"seller1\", \"consignee\": \"Qing Xia\", \"shipment\": \"fly\", \"destination\": \"china\", \"insureInfo\": \"test insure info\", \"tradeTerms\": \"test trade terms\", \"totalCurrency\": \"RMB\", \"buyer\": \"buyer test\", \"trafMode\": \"123456789\", \"goodsInfos\": {\"unitPrice\": 1233.00, \"amount\": 1521522.00, \"quantity\": 1234, \"delDate\": \"20180926120000\", \"quantityCode\": \"thousand\", \"goodsModel\": \"goods models test\", \"goodNo\": \"goodtest\", \"priceCode\": \"YUAN\", \"goodsName\": \"goods Name test\", \"goodsDescription\": \"goods description test\"}, \"totalAmount\": 1521522.00, \"carrier\": \"ShunFeng\", \"poNo\": \"poNo001\", \"sender\": \"Ye Yu\", \"poDate\": \"20180926120000\", \"tradeCountry\": \"US\"}"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com", "peer0.org2.example.com"]
}' \
 "http://$URL/invoke/channel12/mycc"

# query private data from Org1 (Success)
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryPOPrivate",
  "args": ["poNo001"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# query public data from Org1 (Success)
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryPO",
  "args": ["poNo001"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# query private data from Org2 (Failed)
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryPOPrivate",
  "args": ["poNo001"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org2",
  "peers": ["peer0.org2.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# query public data from Org2 (Success)
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryPO",
  "args": ["poNo001"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org2",
  "peers": ["peer0.org2.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# invoke with service discovery
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "uploadPO",
  "args": ["{\"seller\": \"seller1\", \"consignee\": \"Qing Xia\", \"shipment\": \"fly\", \"destination\": \"china\", \"insureInfo\": \"test insure info\", \"tradeTerms\": \"test trade terms\", \"totalCurrency\": \"RMB\", \"buyer\": \"buyer test\", \"trafMode\": \"123456789\", \"goodsInfos\": {\"unitPrice\": 1233.00, \"amount\": 1521522.00, \"quantity\": 1234, \"delDate\": \"20180926120000\", \"quantityCode\": \"thousand\", \"goodsModel\": \"goods models test\", \"goodNo\": \"goodtest\", \"priceCode\": \"YUAN\", \"goodsName\": \"goods Name test\", \"goodsDescription\": \"goods description test\"}, \"totalAmount\": 1521522.00, \"carrier\": \"ShunFeng\", \"poNo\": \"poNo001\", \"sender\": \"Ye Yu\", \"poDate\": \"20180926120000\", \"tradeCountry\": \"US\"}"],
  "orderers": [],
  "useDiscoverService": true,
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com"]
}' \
 "http://$URL/invoke/channel12/mycc"

# query with service discovery
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryPO",
  "args": ["poNo001"],
  "orderers": [],
  "useDiscoverService": true,
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# key level endorsement policy - list orgs
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "kepListOrgs",
  "args": ["poNo001"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# key level endorsement policy - add org
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "kepAddOrgs",
  "args": ["poNo001", "Org1MSP", "Org2MSP"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com", "peer0.org2.example.com"]
}' \
 "http://$URL/invoke/channel12/mycc"

# key level endorsement policy - delete org
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "kepDelOrgs",
  "args": ["poNo001", "Org2MSP"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com", "peer0.org2.example.com"]
}' \
 "http://$URL/invoke/channel12/mycc"

# invoke common - channel12
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "uploadCommon",
  "args": ["commonKey1", "{\"seller\": \"seller1\", \"consignee\": \"Qing Xia\", \"shipment\": \"fly\", \"destination\": \"china\", \"insureInfo\": \"test insure info\", \"tradeTerms\": \"test trade terms\", \"totalCurrency\": \"RMB\", \"buyer\": \"buyer test\", \"trafMode\": \"123456789\", \"goodsInfos\": {\"unitPrice\": 1233.00, \"amount\": 1521522.00, \"quantity\": 1234, \"delDate\": \"20180926120000\", \"quantityCode\": \"thousand\", \"goodsModel\": \"goods models test\", \"goodNo\": \"goodtest\", \"priceCode\": \"YUAN\", \"goodsName\": \"goods Name test\", \"goodsDescription\": \"goods description test\"}, \"totalAmount\": 1521522.00, \"carrier\": \"ShunFeng\", \"poNo\": \"poNo001\", \"sender\": \"Ye Yu\", \"poDate\": \"20180926120000\", \"tradeCountry\": \"US\"}"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com"]
}' \
 "http://$URL/invoke/channel12/mycc"

# query common - channel12
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryCommon",
  "args": ["commonKey1"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# query common history - channel12
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryCommonHistory",
  "args": ["commonKey1"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# rich query common equal - channel12
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "richQueryCommon",
  "args": ["{\"selector\":{\"goodsInfos.goodNo\":\"goodtest\"}}"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# rich query common with pagination - channel12
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "richQueryCommon",
  "args": ["{\"selector\":{\"goodsInfos.goodNo\":\"goodtest\"}}", "1", ""],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# add Org3 to channel12
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "addOrg": "Org3",
  "addOrgSignBy": ["Org1", "Org2"],
  "channelName": "channel12",
  "orderers": ["orderer.example.com"],
  "orgName": "Org1"
}' \
 "http://$URL/channel/addorg"

# join channel12 - Org3
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "channelName": "channel12",
  "orderers": ["orderer.example.com"],
  "orgName": "Org3",
  "peers": ["peer0.org3.example.com","peer1.org3.example.com"]
}' \
 "http://$URL/channel/join"

# install chaincode v2 - Org1
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "localPath": "chaincode/allInOne",
  "chaincodePath": "github.com/chaincode",
  "chaincode": "",
  "chaincodeName": "mycc",
  "chaincodeType": "golang",
  "chaincodeVersion": "v2.0",
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com"]
}' \
 "http://$URL/chaincode/install"

# install chaincode v2 - Org2
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "localPath": "chaincode/allInOne",
  "chaincodePath": "github.com/chaincode",
  "chaincode": "",
  "chaincodeName": "mycc",
  "chaincodeType": "golang",
  "chaincodeVersion": "v2.0",
  "orgName": "Org2",
  "peers": ["peer0.org2.example.com","peer1.org2.example.com"]
}' \
 "http://$URL/chaincode/install"

# install chaincode v2 - Org3
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "localPath": "chaincode/allInOne",
  "chaincodePath": "github.com/chaincode",
  "chaincode": "",
  "chaincodeName": "mycc",
  "chaincodeType": "golang",
  "chaincodeVersion": "v2.0",
  "orgName": "Org3",
  "peers": ["peer0.org3.example.com","peer1.org3.example.com"]
}' \
 "http://$URL/chaincode/install"

# upgrade chaincode v2 on channel12 with Org3
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "chaincodeName": "mycc",
  "chaincodeType": "golang",
  "chaincodeVersion": "v2.0",
  "channelName": "channel12",
  "collection": "WwogIHsKICAgICJuYW1lIjogImNvbGxlY3Rpb25QTyIsCiAgICAicG9saWN5IjogewogICAgICAiaWRlbnRpdGllcyI6IFsKICAgICAgICB7CiAgICAgICAgICAicm9sZSI6IHsKICAgICAgICAgICAgIm5hbWUiOiAibWVtYmVyIiwKICAgICAgICAgICAgIm1zcElkIjogIk9yZzFNU1AiCiAgICAgICAgICB9CiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAicm9sZSI6IHsKICAgICAgICAgICAgIm5hbWUiOiAibWVtYmVyIiwKICAgICAgICAgICAgIm1zcElkIjogIk9yZzJNU1AiCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdLAogICAgICAicG9saWN5IjogewogICAgICAgICIxLW9mIjogWwogICAgICAgICAgewogICAgICAgICAgICAic2lnbmVkLWJ5IjogMAogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgInNpZ25lZC1ieSI6IDEKICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICAicmVxdWlyZWRQZWVyQ291bnQiOiAxLAogICAgIm1heFBlZXJDb3VudCI6IDMsCiAgICAiYmxvY2tUb0xpdmUiOiAxMDAwMDAwCiAgfSwKICB7CiAgICAibmFtZSI6ICJjb2xsZWN0aW9uUE9Qcml2YXRlRGV0YWlscyIsCiAgICAicG9saWN5IjogewogICAgICAiaWRlbnRpdGllcyI6IFsKICAgICAgICB7CiAgICAgICAgICAicm9sZSI6IHsKICAgICAgICAgICAgIm5hbWUiOiAibWVtYmVyIiwKICAgICAgICAgICAgIm1zcElkIjogIk9yZzFNU1AiCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdLAogICAgICAicG9saWN5IjogewogICAgICAgICIxLW9mIjogWwogICAgICAgICAgewogICAgICAgICAgICAic2lnbmVkLWJ5IjogMAogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgICJyZXF1aXJlZFBlZXJDb3VudCI6IDEsCiAgICAibWF4UGVlckNvdW50IjogMywKICAgICJibG9ja1RvTGl2ZSI6IDMKICB9Cl0K",
  "functionName": "",
  "args": [],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com", "peer0.org3.example.com","peer1.org3.example.com"]
}' \
 "http://$URL/chaincode/upgrade"

# invoke PO - Org3
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "uploadPO",
  "args": ["{\"seller\": \"seller1\", \"consignee\": \"Qing Xia\", \"shipment\": \"fly\", \"destination\": \"china\", \"insureInfo\": \"test insure info\", \"tradeTerms\": \"test trade terms\", \"totalCurrency\": \"RMB\", \"buyer\": \"buyer test\", \"trafMode\": \"123456789\", \"goodsInfos\": {\"unitPrice\": 1233.00, \"amount\": 1521522.00, \"quantity\": 1234, \"delDate\": \"20180926120000\", \"quantityCode\": \"thousand\", \"goodsModel\": \"goods models test\", \"goodNo\": \"goodtest\", \"priceCode\": \"YUAN\", \"goodsName\": \"goods Name test\", \"goodsDescription\": \"goods description test\"}, \"totalAmount\": 1521522.00, \"carrier\": \"ShunFeng\", \"poNo\": \"poNo010\", \"sender\": \"Ye Yu\", \"poDate\": \"20180926120000\", \"tradeCountry\": \"US\"}"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org3",
  "peers": ["peer0.org3.example.com"]
}' \
 "http://$URL/invoke/channel12/mycc"

# query PO - Org3
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryPO",
  "args": ["poNo010"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org3",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# delete Org3 from channel12
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "delOrg": "Org3",
  "delOrgSignBy": ["Org1", "Org2"],
  "channelName": "channel12",
  "orderers": ["orderer.example.com"],
  "orgName": "Org1"
}' \
 "http://$URL/channel/delorg"

# batch invoke common - channel12
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "batchUploadCommon",
  "args": ["{\"key\":\"key1\",\"value\":\"value1\"}", "{\"key\":\"key2\",\"value\":\"value2\"}", "{\"key\":\"key3\",\"value\":\"value3\"}"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com", "peer1.org1.example.com", "peer0.org2.example.com", "peer1.org2.example.com"]
}' \
 "http://$URL/invoke/channel12/mycc"

# batch query common - channel12
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "batchQueryCommon",
  "args": ["key1", "key2", "key3"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"]
}' \
 "http://$URL/query/channel12/mycc"

# invoke common encrypt all
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "uploadEncAll",
  "args": ["commonKey2", "{\"seller\": \"seller1\", \"consignee\": \"Qing Xia\", \"shipment\": \"fly\", \"destination\": \"china\", \"insureInfo\": \"test insure info\", \"tradeTerms\": \"test trade terms\", \"totalCurrency\": \"RMB\", \"buyer\": \"buyer test\", \"trafMode\": \"123456789\", \"goodsInfos\": {\"unitPrice\": 1233.00, \"amount\": 1521522.00, \"quantity\": 1234, \"delDate\": \"20180926120000\", \"quantityCode\": \"thousand\", \"goodsModel\": \"goods models test\", \"goodNo\": \"goodtest\", \"priceCode\": \"YUAN\", \"goodsName\": \"goods Name test\", \"goodsDescription\": \"goods description test\"}, \"totalAmount\": 1521522.00, \"carrier\": \"ShunFeng\", \"poNo\": \"poNo001\", \"sender\": \"Ye Yu\", \"poDate\": \"20180926120000\", \"tradeCountry\": \"US\"}"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com", "peer0.org2.example.com"],
  "transient": {
    "ENCKEY": "XCcMnNlh0vekZYXz8ZIjUZ8QOMjFUzVDrwg1mrfJZas="
  }
}' \
 "http://$URL/invoke/channel12/mycc"

# query common decrypt all
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryDecAll",
  "args": ["commonKey2"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"],
  "transient": {
    "DECKEY": "XCcMnNlh0vekZYXz8ZIjUZ8QOMjFUzVDrwg1mrfJZas="
  }
}' \
 "http://$URL/query/channel12/mycc"

# batch upload encrypt all
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "uploadEncryptBatch",
  "args": ["{\"key\":\"key1\",\"value\":\"value1\"}", "{\"key\":\"key2\",\"value\":\"value2\"}", "{\"key\":\"key3\",\"value\":\"value3\"}"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com", "peer0.org2.example.com"],
  "transient": {
    "ENCKEY": "XCcMnNlh0vekZYXz8ZIjUZ8QOMjFUzVDrwg1mrfJZas="
  }
}' \
 "http://$URL/invoke/channel12/mycc"

# batch query decrypt all
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "functionName": "queryDecryptBatch",
  "args": ["key1", "key2", "key3"],
  "orderers": ["orderer.example.com"],
  "orgName": "Org1",
  "peers": ["peer0.org1.example.com","peer1.org1.example.com", "peer0.org2.example.com","peer1.org2.example.com"],
  "transient": {
    "DECKEY": "XCcMnNlh0vekZYXz8ZIjUZ8QOMjFUzVDrwg1mrfJZas="
  }
}' \
 "http://$URL/query/channel12/mycc"

