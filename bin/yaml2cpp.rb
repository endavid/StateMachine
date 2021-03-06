#!/usr/bin/ruby

########################################################
# yaml2cpp.rb
#
# Creates a StateMachine from a YAML file
#
# @author David Gavilan
#
########################################################

require 'yaml'

########################################################
# globals
########################################################
$filename = ""
$outputHeader = ""
$outputCpp = ""
$classname = ""
$h_guard = ""

########################################################
# setup
########################################################

def parseParameters()
	if ARGV.size != 1
		puts "#{__FILE__} filename"
		exit(0)
	end
	$filename = ARGV[0]

	if !File.exists?($filename)
		puts $filename + " doesn't exist."
		exit(0)
	end

	basename = File.basename($filename, File.extname( $filename ) )
	$classname = basename
	# find unique output filename (avoid overwriting existing files)
	interfix = 0
	begin
		suffix = interfix > 0 ? "_" + interfix.to_s : ""
		$outputHeader = basename + suffix + ".h"
		$outputCpp = basename + suffix + ".cpp"
		interfix += 1
	end while File.exists?($outputHeader) || File.exists?($outputCpp)

	# strings for code generation
	basenameWithUnderscores = basename.gsub(/[\s-]/, '_') 
	$h_guard = "STATEMACHINE_"+ basenameWithUnderscores.upcase+"_H_"
end

def createHeader(states)
	begin
		file = File.open($outputHeader, "w")
		file.puts "// File autogenerated with yaml2cpp.rb\n\n"
		file.puts "\#ifndef #{$h_guard}"
		file.puts "\#define #{$h_guard}\n\n"
		file.puts "\#include \"core/StateMachine.h\"\n\n"
		file.puts "class #{$classname} : public vd::core::StateMachine<#{$classname}> {"
		file.puts "public:"
		file.puts "\t#{$classname}();\n\n"
		file.puts "protected:"
		file.puts 	"virtual void CommonUpdate(const float time_ms);\n\n"
		file.puts "private:"

		# loop through the states
		states.each {|key, value|
			file.puts "\tvoid State#{key}(const float time_ms);"
		}

		file.puts "};\n\n"
		file.puts "\#endif // #{$h_guard}"

	rescue IOError => e
		#some error occur, dir not writable etc.
	ensure
		file.close unless file == nil
	end
end

def createCpp(states)
	begin
		# Use Ruby 1.9.x. Previous version of Ruby do not preserve the order of Hash keys, but 1.9 does.
		initState = states.keys[0]
		file = File.open($outputCpp, "w")
		file.puts "// File autogenerated with yaml2cpp.rb\n\n"
		file.puts "\#include \"#{$outputHeader}\"\n\n"
		file.puts "#{$classname}::#{$classname}()"
		file.puts ": Super(&#{$classname}::State#{initState})"
		file.puts "{\n\n}\n\n"
		file.puts "void #{$classname}::CommonUpdate(const float time_ms)"
		file.puts "{\n\n}\n\n"

		file.puts "// ---------------------------------------------------------"
		file.puts "// States"
		file.puts "// ---------------------------------------------------------"
		file.puts "\#pragma mark States\n\n"
		# loop through the states
		states.each {|key, value|
			file.puts "void #{$classname}::State#{key}(const float time_ms)\n{"
			if !value.nil?
				value.each {|jumpKey, jumpCondition|
					if jumpKey == "attributes"
						# ignore this node. Not a jump of state
					elsif !jumpCondition.nil? && !jumpCondition["when"].nil?
						condition = jumpCondition["when"]
						file.puts "\tif (false /* #{condition} */) {"
						file.puts "\t\tSwitchTo(&#{$classname}::State#{jumpKey});"
						file.puts "\t}"
					else
						file.puts "\tSwitchTo(&#{$classname}::State#{jumpKey});"
					end
				}
			end
			file.puts "}"
		}

	rescue IOError => e
		#some error occur, dir not writable etc.
	ensure
		file.close unless file == nil
	end
end

########################################################
# Main
########################################################
if __FILE__ == $0 # when included as a lib, this code won't execute :)
	parseParameters()
	states = YAML.load_file($filename)
	# puts states.inspect
	# Eg. {"Init"=>{"Start"=>{"when"=>"everything ready"}}, ... "Exit"=>nil}
	createHeader(states)
	createCpp(states)
end