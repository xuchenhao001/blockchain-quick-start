// Writen by Xu Chen Hao
package main

import (
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type SimpleChaincode struct {
}

func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	return shim.Success(nil)
}

func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()
	if function == "initAccount" {
		return t.initAccount(stub, args)
	} else if function == "addPoints" {
		return t.addPoints(stub, args)
	} else if function == "balanceQuery" {
		return t.balanceQuery(stub, args)
	}

	return shim.Error("Invalid invoke function name. " + 
		"Expecting \"invoke\" \"query\"")
}

// Init an account
// this function needs 1 parameter: account
// "Args":["initAccount","testAccount"]
func (t *SimpleChaincode) initAccount(stub shim.ChaincodeStubInterface, 
	args []string) pb.Response {
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments: " + 
			strconv.Itoa(len(args)) + "Expecting 1")
	}

	account := args[0]
	balanceStr := "0"

	err = stub.PutState(account, []byte(balanceStr))
	if err != nil {
		return shim.Error(err.Error())
	}
	jsonResp := "{\"Account\":\"" + account + "\"," +
	    "\"Balance\":" + balanceStr + "}"
	fmt.Printf("Account init success: %s\n", jsonResp)
	return shim.Success(nil)
}

// Update an account
// this function needs 2 parameters: account, points.
// "Args":["addPoints","testAccount","5"]
func (t *SimpleChaincode) addPoints(stub shim.ChaincodeStubInterface, 
	args []string) pb.Response {
	var err error

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments: " + 
			strconv.Itoa(len(args)) + "Expecting 2")
	}

	account := args[0]
	points, err := strconv.Atoi(args[1])
	if err != nil {
		return shim.Error("Invalid points amount, expecting a integer value")
	}

	// Get the old balance
	oldValueByte, err := stub.GetState(account)
	if err != nil {
		return shim.Error("Failed to get state")
	}
	if oldValueByte == nil {
		return shim.Error("Entity not found")
	}
	oldValue, _ := strconv.Atoi(string(oldValueByte))
	
	// Perform the execution
	newValue := oldValue + points
	newValueStr := strconv.Itoa(newValue)

	err = stub.PutState(account, []byte(newValueStr))
	if err != nil {
		return shim.Error(err.Error())
	}
	jsonResp := "{\"Account\":\"" + account + "\"," +
	    "\"Balance\":" + newValueStr + "}"
	fmt.Printf("Add points success: %s\n", jsonResp)
	return shim.Success(nil)
}


// Check an account
// this function needs 1 parameter: account
// "Args":["balanceQuery","testAccount"]
func (t *SimpleChaincode) balanceQuery(stub shim.ChaincodeStubInterface, 
	args []string) pb.Response {
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting account " +
		"of the person to query")
	}

	account := args[0]

	// Get the state from the ledger
	balanceByte, err := stub.GetState(account)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get state for " + account + "\"}"
		return shim.Error(jsonResp)
	}

	if balanceByte == nil {
		jsonResp := "{\"Error\":\"Nil amount for " + account + "\"}"
		return shim.Error(jsonResp)
	}

	jsonResp := "{\"Account\":\"" + account + "\",\"Balance\":" + 
		string(balanceByte) + "}"
	fmt.Printf("Query Success: %s\n", jsonResp)
	return shim.Success(balanceByte)
}

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

