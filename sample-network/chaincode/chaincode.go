// Writen by Xu Chen Hao
package main

import (
	"fmt"
	"encoding/json"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type SimpleChaincode struct {
}

type DBValue struct {
	Balance int
	Details string
}

func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	var err error

	account := "testAccount"
	value := DBValue{Balance: 1000, Details: "test details"}
	// Write the state to the ledger
	valueMarshal, err := json.Marshal(value)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(account, valueMarshal)
	if err != nil {
		return shim.Error(err.Error())
	}

	jsonResp := "{\"Account\":\"" + account + "\"," +
	    "\"Balance\":1000,\"Detail\":\"test details\"}"
	fmt.Printf("Init Success: %s\n", jsonResp)
	return shim.Success(nil)
}

func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()
	if function == "invoke" {
		return t.invoke(stub, args)
	} else if function == "query" {
		return t.query(stub, args)
	}

	return shim.Error("Invalid invoke function name. " + 
		"Expecting \"invoke\" \"query\"")
}

// Create/Update an account
// this function needs 3 parameters: account, balance, details.
// "Args":["invoke","testAccount","1010","ICBC"]
func (t *SimpleChaincode) invoke(stub shim.ChaincodeStubInterface, 
	args []string) pb.Response {
	var err error

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments: " + 
			strconv.Itoa(len(args)) + "Expecting 3")
	}

	account := args[0]
	balanceStr := args[1]
	balance, err := strconv.Atoi(balanceStr)
	if err != nil {
		return shim.Error(err.Error())
	}
	details := args[2]

	// Update the state to the ledger
	value := DBValue{Balance: balance, Details: details}
	valueMarshal, err := json.Marshal(value)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(account, valueMarshal)
	if err != nil {
		return shim.Error(err.Error())
	}
	jsonResp := "{\"Account\":\"" + account + "\"," +
	    "\"Balance\":" + balanceStr + ",\"Detail\":\"" + details + "\"}"
	fmt.Printf("Invoke Success: %s\n", jsonResp)
	return shim.Success(nil)
}


// Check an account
// this function needs 1 parameter: account
// "Args":["query","testAccount"]
func (t *SimpleChaincode) query(stub shim.ChaincodeStubInterface, 
	args []string) pb.Response {
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting account " +
		"of the person to query")
	}

	account := args[0]

	// Get the state from the ledger
	valueByte, err := stub.GetState(account)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get state for " + account + "\"}"
		return shim.Error(jsonResp)
	}

	value := DBValue{}
	err = json.Unmarshal(valueByte, &value)
	jsonResp := "{\"Account\":\"" + account + "\",\"Balance\":" + 
		strconv.Itoa(value.Balance) + ",\"Detail\":\"" + 
		value.Details + "\"}"
	fmt.Printf("Query Success: %s\n", jsonResp)
	return shim.Success([]byte(strconv.Itoa(value.Balance)))
}

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

