// Written by Xu Chen Hao
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
	"strconv"
)

var poPrefix = ""

type GoodsInfos struct {
	UnitPrice        float32 `json:"unitPrice"`
	Amount           float32 `json:"amount"`
	Quantity         float32 `json:"quantity"`
	DelDate          string  `json:"delDate"`
	QuantityCode     string  `json:"quantityCode"`
	GoodsModel       string  `json:"goodsModel"`
	GoodNo           string  `json:"goodNo"`
	PriceCode        string  `json:"priceCode"`
	GoodsName        string  `json:"goodsName"`
	GoodsDescription string  `json:"goodsDescription"`
}

type PO struct {
	Seller        string     `json:"seller"`
	Consignee     string     `json:"consignee"`
	Shipment      string     `json:"shipment"`
	Destination   string     `json:"destination"`
	InsureInfo    string     `json:"insureInfo"`
	TradeTerms    string     `json:"tradeTerms"`
	TotalCurrency string     `json:"totalCurrency"`
	Buyer         string     `json:"buyer"`
	TrafMode      string     `json:"trafMode"`
	GoodsInfos    GoodsInfos `json:"goodsInfos"`
	TotalAmount   float32    `json:"totalAmount"`
	Carrier       string     `json:"carrier"`
	PoNo          string     `json:"poNo"`
	Sender        string     `json:"sender"`
	PoDate        string     `json:"poDate"`
	TradeCountry  string     `json:"tradeCountry"`
}

func (s *SmartContract) validatePO(po PO) bool {
	if po.GoodsInfos.UnitPrice <= 0 {
		return false
	}
	if po.GoodsInfos.Quantity <= 0 {
		return false
	}
	if po.GoodsInfos.Amount <= 0 {
		return false
	}
	if po.GoodsInfos.UnitPrice*po.GoodsInfos.Quantity != po.GoodsInfos.Amount {
		return false
	}
	return true
}

func (s *SmartContract) writeChainPO(APIstub shim.ChaincodeStubInterface, po PO) error {
	poAsBytes, err := json.Marshal(po)
	if err != nil {
		return err
	}
	logger.Debug("Write PO on chain: " + string(poAsBytes))
	poKey := poPrefix + po.PoNo
	err = APIstub.PutState(poKey, poAsBytes)
	if err != nil {
		return err
	}
	return nil
}

func (s *SmartContract) uploadPO(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return s.returnError("参数数量不正确")
	}

	logger.Debug("获取请求参数: " + args[0])

	poAsBytes := []byte(args[0])
	var po PO
	err := json.Unmarshal(poAsBytes, &po)
	if err != nil {
		return s.returnError("PO单格式错误: " + err.Error())
	}

	// 验证PO单是否合法
	if !s.validatePO(po) {
		return s.returnError("PO单不合法")
	}

	// 数据上链
	err = s.writeChainPO(APIstub, po)
	if err != nil {
		return s.returnError("PO单上链失败: " + err.Error())
	}

	return shim.Success(poAsBytes)

}

func (s *SmartContract) queryPO(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return s.returnError("参数数量不正确")
	}

	po := args[0]
	logger.Debug("Query PO on chain: " + po)
	poKey := poPrefix + po
	result, err := APIstub.GetState(poKey)
	if err != nil {
		return s.returnError("po单查询失败" + err.Error())
	}
	return shim.Success(result)
}

func (s *SmartContract) queryPOHistory(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return s.returnError("参数数量不正确")
	}

	po := args[0]
	logger.Debug("Query on chain: " + po)
	poKey := poPrefix + po
	result, err := s.queryHistoryAsset(APIstub, poKey)
	if err != nil {
		return s.returnError("po单查询失败" + err.Error())
	}
	return shim.Success(result)
}

func (s *SmartContract) richQueryPO(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) == 1 {

		// rich query without pagination
		queryString := args[0]
		logger.Debug("Rich query on chain: " + queryString)
		result, err := s.richQuery(APIstub, queryString)
		if err != nil {
			return s.returnError("Rich query failed: " + err.Error())
		}
		return shim.Success(result)

	} else if len(args) == 3 {

		// rich query with pagination
		queryString := args[0]
		pageSize, err := strconv.ParseInt(args[1], 10, 32)
		if err != nil {
			return s.returnError("Error convert arg 2 to int32: " + err.Error())
		}
		bookmark := args[2]
		logger.Debugf("Rich query %s with pagination ( page size %s, bookmark %s )",
			queryString, pageSize, bookmark)
		result, err := s.richQueryWithPagination(APIstub, queryString, int32(pageSize), bookmark)
		if err != nil {
			return s.returnError("Rich query failed: " + err.Error())
		}
		return shim.Success(result)

	} else {
		return s.returnError("参数数量不正确")
	}
}

func (s *SmartContract) richQuery(stub shim.ChaincodeStubInterface, queryString string) ([] byte, error) {

	logger.Debugf("Get rich query request: \n%s\n", queryString)

	resultsIterator, err := stub.GetQueryResult(queryString)
	defer resultsIterator.Close()
	if err != nil {
		return nil, err
	}

	buffer, err := constructQueryResponseFromIterator(resultsIterator)
	if err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}

func (s *SmartContract) richQueryWithPagination(stub shim.ChaincodeStubInterface,
	queryString string, pageSize int32, bookmark string) ([] byte, error) {

	queryResults, err := getQueryResultForQueryStringWithPagination(stub, queryString, int32(pageSize), bookmark)
	if err != nil {
		return nil, err
	}
	return queryResults, nil
}

func getQueryResultForQueryStringWithPagination(stub shim.ChaincodeStubInterface,
	queryString string, pageSize int32, bookmark string) ([]byte, error) {

	logger.Debugf("- getQueryResultForQueryString queryString:\n%s\n", queryString)

	resultsIterator, responseMetadata, err := stub.GetQueryResultWithPagination(queryString, pageSize, bookmark)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	buffer, err := constructQueryResponseFromIterator(resultsIterator)
	if err != nil {
		return nil, err
	}

	bufferWithPaginationInfo := addPaginationMetadataToQueryResults(buffer, responseMetadata)

	logger.Debugf("- getQueryResultForQueryString queryResult:\n%s\n", bufferWithPaginationInfo.String())

	return buffer.Bytes(), nil
}

func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) (*bytes.Buffer, error) {
	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	return &buffer, nil
}

func addPaginationMetadataToQueryResults(buffer *bytes.Buffer, responseMetadata *sc.QueryResponseMetadata) *bytes.Buffer {

	buffer.WriteString("[{\"ResponseMetadata\":{\"RecordsCount\":")
	buffer.WriteString("\"")
	buffer.WriteString(fmt.Sprintf("%v", responseMetadata.FetchedRecordsCount))
	buffer.WriteString("\"")
	buffer.WriteString(", \"Bookmark\":")
	buffer.WriteString("\"")
	buffer.WriteString(responseMetadata.Bookmark)
	buffer.WriteString("\"}}]")

	return buffer
}
